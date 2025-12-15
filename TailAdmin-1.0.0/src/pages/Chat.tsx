import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Dropdown } from "../components/ui/dropdown/Dropdown";
import { UserCircleIcon } from "../icons";
import { adminChatService, ChatRoom, ChatMessage } from "../services/chat.service";
import { questionsService } from "../services/questions.service";
import { subjectsService } from "../services/subjects.service";
import apiService from "../services/api.service";
import { API_ENDPOINTS } from "../config/api.config";
import examsService from "../services/exams.service";

export default function Chat() {
  const location = useLocation();
  const isAIChat = location.pathname.includes("/ai-chat");
  const geminiKeyEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env ? (((import.meta as any).env.VITE_GEMINI_API_KEY || '') as string).trim() : '') as string;
  const geminiKey = geminiKeyEnv || (typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '').trim() : '');
  const geminiModelEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env ? (((import.meta as any).env.VITE_GEMINI_MODEL || '') as string).trim() : '') as string;
  const geminiModelLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '';
  const geminiModel = geminiModelEnv || geminiModelLS || 'gemini-2.5-pro';
  const ossKeyEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env ? ((((import.meta as any).env.VITE_GROQ_API_KEY || (import.meta as any).env.VITE_OSS_API_KEY) || '') as string).trim() : '') as string;
  const ossKey = ossKeyEnv || (typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '') as string).trim() : '');
  const aiLogUrl = (() => {
    try {
      const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
      const fromEnv = String(envAny.VITE_AI_LOG_URL || '').trim();
      const fromLs = typeof localStorage !== 'undefined' ? (String(localStorage.getItem('ai_log_url') || '').trim()) : '';
      return fromEnv || fromLs || '';
    } catch { return ''; }
  })();
  const postAiLog = async (payload: any) => {
    if (!aiLogUrl) return;
    try { await apiService.post(aiLogUrl, payload); } catch {}
  };
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ id: number; role: "user" | "ai"; content: string; time: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiProgress, setAiProgress] = useState<Array<{ id: number; text: string; status: 'pending' | 'in_progress' | 'done' | 'error' }>>([]);
  const AI_STORAGE_KEY = "tailadmin_ai_chat_messages";
  const [showFooterProgress, setShowFooterProgress] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const resolveInitialProviderAndModel = (): { provider: 'gemini' | 'groq' | 'local'; model: string } => {
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
    const provLS = (typeof localStorage !== 'undefined' ? (localStorage.getItem('ai_provider') || '') : '').toLowerCase();
    const groqKeyEnv = String((envAny.VITE_GROQ_API_KEY || envAny.VITE_OSS_API_KEY || '')).trim();
    const groqKeyLS = typeof localStorage !== 'undefined' ? String((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '')).trim() : '';
    const groqModelEnv = String((envAny.VITE_GROQ_MODEL || envAny.VITE_OSS_MODEL || '')).trim();
    const groqModelLS = typeof localStorage !== 'undefined' ? String((localStorage.getItem('oss_model') || localStorage.getItem('groq_model') || '')).trim() : '';
    const groqModelInit = groqModelEnv || groqModelLS || 'llama-3.3-70b-versatile';
    const gemModelInit = geminiModel;
    
    if (provLS === 'local') return { provider: 'local', model: 'Llama-3-8B-Local' };
    const preferGroq = provLS.includes('groq') || (groqKeyEnv.length > 20) || (groqKeyLS.length > 20);
    return preferGroq ? { provider: 'groq', model: groqModelInit } : { provider: 'gemini', model: gemModelInit };
  };
  const init = resolveInitialProviderAndModel();
  const [selectedModel, setSelectedModel] = useState<string>(init.model);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'groq' | 'local'>(init.provider);

  const handleSelectModel = (model: string, provider: 'gemini' | 'groq' | 'local') => {
    setSelectedModel(model);
    setSelectedProvider(provider);
    try {
      localStorage.setItem('ai_provider', provider);
      if (provider === 'gemini') {
        localStorage.setItem('gemini_model', model);
        const current = String(localStorage.getItem('gemini_models') || '').trim();
        const set = Array.from(new Set([current, model].join(',').split(',').map(s => s.trim()).filter(Boolean)));
        localStorage.setItem('gemini_models', set.join(','));
      } else if (provider === 'local') {
         localStorage.setItem('local_model', model);
      } else {
        localStorage.setItem('oss_model', model);
        const current2 = String((localStorage.getItem('oss_models') || localStorage.getItem('groq_models') || '')).trim();
        const set2 = Array.from(new Set([current2, model].join(',').split(',').map(s => s.trim()).filter(Boolean)));
        localStorage.setItem('oss_models', set2.join(','));
        localStorage.setItem('groq_models', set2.join(','));
      }
    } catch {}
    setModelOpen(false);
  };

  const getAllGeminiModels = (): string[] => {
    const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
    const modelsCsv = String(envObj.VITE_GEMINI_MODELS || '').trim();
    const modelsExtraKeys = Object.keys(envObj).filter(k => /^VITE_GEMINI_MODEL_\d+$/.test(k));
    const modelsExtra = modelsExtraKeys.map(k => String(envObj[k] || '').trim()).filter(Boolean);
    const lsCsv = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_models') || '') : '';
    const base = [selectedModel, geminiModel, modelsCsv, ...modelsExtra, lsCsv].join(',').split(',').map(s => s.trim()).filter(Boolean);
    const defaults = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
    return Array.from(new Set([...base, ...defaults])).filter(Boolean);
  };

  const getAllOssModels = (): string[] => {
    const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
    const modelsCsv = String((envObj as any).VITE_OSS_MODELS || (envObj as any).VITE_GROQ_MODELS || '').trim();
    const modelsExtraKeys = Object.keys(envObj).filter(k => /^VITE_(OSS|GROQ)_MODEL_\d+$/.test(k));
    const modelsExtra = modelsExtraKeys.map(k => String((envObj as any)[k] || '').trim()).filter(Boolean);
    const lsCsv = typeof localStorage !== 'undefined' ? ((localStorage.getItem('oss_models') || localStorage.getItem('groq_models') || '') as string) : '';
    const base = [modelsCsv, ...modelsExtra, lsCsv].join(',').split(',').map(s => s.trim()).filter(Boolean);
    const defaults = ['Multilingual GPT OSS 120B', 'GPT OSS 20B', 'Kimi K2', 'Llama 4 Scout', 'Llama 3.3 70B', 'Whisper Large v3'];
    return Array.from(new Set([...base, ...defaults])).filter(Boolean);
  };

  const mapDisplayModelToGroq = (name: string): string => {
    const s = String(name || '').toLowerCase();
    if (/llama\s*3\.3\s*70b/i.test(s) || s.includes('llama')) return 'llama-3.3-70b-versatile';
    if (s.includes('whisper')) return 'whisper-large-v3';
    return 'llama-3.3-70b-versatile';
  };

  const getAllGeminiKeys = (): string[] => {
    const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
    const keysCsv = String(envObj.VITE_GEMINI_API_KEYS || '').trim();
    const key = String(envObj.VITE_GEMINI_API_KEY || '').trim();
    const altKeys = Object.keys(envObj).filter(k => /^VITE_GEMINI_API_KEY_\d+$/.test(k)).map(k => String(envObj[k] || '').trim());
    const lsCsv = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_keys') || '') : '';
    const lsKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '') : '';
    const backup = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key_backup') || '') : '';
    return Array.from(new Set([keysCsv, key, ...altKeys, lsCsv, lsKey, backup].join(',').split(',').map(s => s.trim()).filter(s => s.length > 20)));
  };

  const getAllOssKeys = (): string[] => {
    const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
    const keysCsv = String((envObj as any).VITE_GROQ_API_KEYS || (envObj as any).VITE_OSS_API_KEYS || '').trim();
    const key = String((envObj as any).VITE_GROQ_API_KEY || (envObj as any).VITE_OSS_API_KEY || '').trim();
    const altKeys = Object.keys(envObj).filter(k => /^VITE_(GROQ|OSS)_API_KEY_\d+$/.test(k)).map(k => String((envObj as any)[k] || '').trim());
    const lsCsv = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_keys') || localStorage.getItem('oss_api_keys') || '') as string) : '';
    const lsKey = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '') as string) : '';
    return Array.from(new Set([keysCsv, key, ...altKeys, lsCsv, lsKey].join(',').split(',').map(s => s.trim()).filter(s => s.length > 20)));
  };

  const callGeminiText = async (prompt: string): Promise<string> => {
    try {
      const sid = await getAiSubjectId(prompt);
      const models = getAllGeminiModels();
      const keys = getAllGeminiKeys();
      // Always use MultipleChoice to ensure backend compatibility, as Essay type might cause 400 errors
      const payload = { description: prompt, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 } as any;
      const tryParseRaw = (raw: any): string => {
        try {
          const s = String(raw || '').trim();
          if (!s) return '';
          const clean = s.replace(/```json/g, '').replace(/```/g, '').trim();
          const obj = JSON.parse(clean);
          // Try to extract from Gemini candidates
          if (obj.candidates) {
            const parts = (((obj?.candidates?.[0]?.content?.parts) || []) as any[]).map(p => String(p?.text || ''));
            const text = parts.filter(Boolean).join('\n').trim();
            if (text) return text;
          }
          // Try to extract from Question object structure
          if (obj.content || obj.Content) {
             return String(obj.content || obj.Content || '').trim();
          }
          // If it's a simple object with just text/message
          if (obj.text || obj.message) return String(obj.text || obj.message);
          return '';
        } catch { 
            // If parse fails, maybe it's just a plain text string?
            // But we should be careful not to return the raw JSON if it failed to parse
            return ''; 
        }
      };
      for (const k of (keys.length ? keys : [''])) {
        for (const m of models) {
          try {
            const headers: Record<string, string> | undefined = k ? ({ 'X-Gemini-Api-Key': k, 'X-Gemini-Model': m }) : undefined;
            const res = await apiService.post<any>(API_ENDPOINTS.questions.generateAI, payload, headers);
            const root = (res?.data ?? res?.Data ?? res) as any;
            const raw = root?.raw ?? root?.data?.raw ?? root?.Data?.raw ?? '';
            let text = tryParseRaw(raw);
            if (!text) {
              const contentField = String(root?.content ?? root?.Content ?? '').trim();
              text = contentField;
            }
            // Strict echo check
            if (text && text.toLowerCase().trim() !== prompt.toLowerCase().trim()) return text;
          } catch {}
        }
      }
      return '';
    } catch { return ''; }
  };

  const callOssText = async (prompt: string): Promise<string> => {
    try {
      const sid = await getAiSubjectId(prompt);
      const models = getAllOssModels();
      const keys = (() => {
        const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
        const keysCsv = String((envObj as any).VITE_GROQ_API_KEYS || (envObj as any).VITE_OSS_API_KEYS || '').trim();
        const key = String((envObj as any).VITE_GROQ_API_KEY || (envObj as any).VITE_OSS_API_KEY || '').trim();
        const altKeys = Object.keys(envObj).filter(k => /^VITE_(GROQ|OSS)_API_KEY_\d+$/.test(k)).map(k => String((envObj as any)[k] || '').trim());
        const lsCsv = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_keys') || localStorage.getItem('oss_api_keys') || '') as string) : '';
        const lsKey = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '') as string) : '';
        return Array.from(new Set([keysCsv, key, ...altKeys, lsCsv, lsKey].join(',').split(',').map(s => s.trim()).filter(s => s.length > 20)));
      })();
      const payload = { description: prompt, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 } as any;
      for (const k of (keys.length ? keys : [''])) {
        for (const m of models) {
          try {
            const actualModel = mapDisplayModelToGroq(m);
            const r = await questionsService.generateAIQuestionWithModel(payload, actualModel, k);
            const text = String(r?.content || '').trim();
            if (text && text.toLowerCase().trim() !== prompt.toLowerCase().trim()) return text;
          } catch {}
        }
      }
      try {
        const envObj: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
        const key = String((envObj.VITE_GROQ_API_KEY || envObj.VITE_OSS_API_KEY || '')).trim() || (typeof localStorage !== 'undefined' ? String((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '')).trim() : '');
        const modelGroq = mapDisplayModelToGroq(selectedModel);
        if (key && key.length > 20) {
          const url = 'https://api.groq.com/openai/v1/chat/completions';
          const body = { model: modelGroq, messages: [{ role: 'user', content: prompt }], temperature: 0.5 } as any;
          const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (res.ok) {
            const data = await res.json();
            const text = String(data?.choices?.[0]?.message?.content || '').trim();
            if (text && text.toLowerCase().trim() !== prompt.toLowerCase().trim()) return text;
          }
        }
      } catch {}
      return '';
    } catch { return ''; }
  };

  const callLocalText = async (prompt: string): Promise<string> => {
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      if (res.ok) {
        const data = await res.json();
        return String(data.response || '').trim();
      }
      return '';
    } catch (err) {
      console.error('Local AI call failed', err);
      return '';
    }
  };

  // Filter rooms by search query
  const filteredRooms = useMemo(
    () => rooms.filter((room) => 
      room.name.toLowerCase().includes(query.toLowerCase()) ||
      room.creatorName.toLowerCase().includes(query.toLowerCase())
    ),
    [rooms, query]
  );

  // Get active room
  const activeRoom = useMemo(
    () => rooms.find(r => r.roomId === activeRoomId),
    [rooms, activeRoomId]
  );

  // Load all support rooms on mount
  useEffect(() => {
    if (!isAIChat) {
      loadRooms();
      adminChatService.connect().catch(() => {});
      const unsubscribe = adminChatService.onMessageReceived((message) => {
        setMessages(prev => {
          if (prev.find(m => m.messageId === message.messageId)) {
            return prev;
          }
          return [...prev, message];
        });
      });
      return () => {
        unsubscribe();
        adminChatService.disconnect();
      };
    }
  }, [isAIChat]);

  // Load messages when active room changes
  useEffect(() => {
    if (!isAIChat && activeRoomId) {
      loadChatHistory(activeRoomId);
    }
  }, [activeRoomId, isAIChat]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ 
      top: listRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  }, [messages.length, aiMessages.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) setAiMessages(data);
      }
    } catch { void 0; }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiMessages));
    } catch { void 0; }
  }, [aiMessages]);

  /**
   * Load all chat rooms
   */
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const response = await adminChatService.getAllRooms(1, 100);
      if (response.success) {
        const supportRooms = response.data.filter(r => r.roomType === 'support');
        const map: Record<string, ChatRoom> = {};
        for (const r of supportRooms) {
          const key = String(r.createdBy || r.creatorName || r.name).toLowerCase();
          const existing = map[key];
          if (!existing) {
            map[key] = r;
          } else {
            const t1 = new Date(existing.lastMessage?.sentAt || existing.createdAt).getTime();
            const t2 = new Date(r.lastMessage?.sentAt || r.createdAt).getTime();
            if (t2 > t1) map[key] = r;
          }
        }
        const deduped = Object.values(map);
        setRooms(deduped);
        
        // Auto select first room
        if (deduped.length > 0 && !activeRoomId) {
          setActiveRoomId(deduped[0].roomId);
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
    setIsLoading(false);
  };

  const formatRoomName = (name?: string): string => {
    const s = (name || '').trim();
    if (!s) return '';
    const m = s.match(/^(?:Hỗ trợ trực tuyến|Ho tro truc tuyen|Support room|Support|Hỗ trợ)\s*[-–—:\|]?\s*(.*)$/i);
    if (m && m[1]) return m[1].trim();
    return s;
  };

  /**
   * Load chat history for a room
   */
  const loadChatHistory = async (roomId: number) => {
    setIsLoading(true);
    try {
      // First, make sure admin is member of the room
      await adminChatService.joinChatRoom(roomId);
      
      // Then load history
      const history = await adminChatService.getChatHistory(roomId, 1, 100);
      if (history) {
        setMessages(history.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
    setIsLoading(false);
  };

  /**
   * Send message
   */
  const sendMessage = async () => {
    if (!input.trim() || !activeRoomId || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);

    try {
      const sent = await adminChatService.sendMessage(activeRoomId, messageContent);
      if (sent && typeof sent.messageId === 'number') {
        const raw = localStorage.getItem('authUser') || localStorage.getItem('auth_user') || localStorage.getItem('user') || localStorage.getItem('USER') || '';
        let adminId: any = 0;
        let adminName = '';
        try {
          const u = raw ? JSON.parse(raw) : null;
          adminId = u?.id ?? u?.userId ?? u?.UserId ?? 0;
          adminName = (u?.fullName || u?.username || '').toString();
          if (typeof adminId === 'string') adminId = parseInt(adminId, 10);
        } catch {}
        const adjusted: ChatMessage = {
          ...sent,
          senderId: typeof adminId === 'number' && !Number.isNaN(adminId) && adminId ? adminId : sent.senderId,
          senderName: adminName || sent.senderName,
        };
        setMessages(prev => {
          if (prev.find(m => m.messageId === adjusted.messageId)) return prev;
          return [...prev, adjusted];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setInput(messageContent); // Restore message
    }
    setIsSending(false);
  };

  const formatTime = (date: Date | string): string => {
    const d = new Date(date);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getAiSubjectId = async (prompt: string): Promise<number> => {
    try {
      const list = await subjectsService.getSubjects();
      const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const p = norm(prompt);
      let foundId = 0;
      for (const s of list) {
        const n = norm(s.name || '');
        if (n && (p.includes(n) || n.includes(p))) { foundId = s.subjectId; break; }
        const d = norm(s.description || '');
        if (!foundId && d && (p.includes(d) || d.includes(p))) { foundId = s.subjectId; break; }
      }
      if (foundId) return foundId;
      const extract = () => {
        const m1 = prompt.match(/về\s+([^.,;:!?]+)(?:[.,;:!?]|$)/i);
        if (m1 && m1[1]) return m1[1].trim();
        const m2 = prompt.match(/chủ\s*đề\s*:?\s*([^.,;:!?]+)(?:[.,;:!?]|$)/i);
        if (m2 && m2[1]) return m2[1].trim();
        const words = prompt.replace(/\s+/g, ' ').trim().split(' ').slice(0, 5).join(' ');
        return words || 'Chung';
      };
      let candidate = extract();
      candidate = candidate.slice(0, 50);
      const existing = list.find(s => norm(s.name) === norm(candidate));
      if (existing) return existing.subjectId;
      const created = await subjectsService.createSubject({ name: candidate, description: 'Tạo tự động từ AI' });
      return created.subjectId;
    } catch (err) {
      console.error('getAiSubjectId failed', err);
      throw err;
    }
  };

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text) return;
    const now = new Date();
    const userMsg = { id: Date.now(), role: "user" as const, content: text, time: formatTime(now) };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setAiSending(true);
    const lowInit = text.toLowerCase();
    const isExamInit = /tạo\s+bài\s+thi|tao\s+bai\s+thi|create\s+exam/i.test(lowInit);
    const isQuestionsInit = /tạo\s+câu\s+hỏi|tao\s+cau\s+hoi|create\s+question(s)?/i.test(lowInit);
    const planTextInit = isExamInit
      ? ['Kế hoạch xử lý:', '1. Xác nhận yêu cầu tạo bài thi', '2. Phân tích nội dung và xác định môn học', '3. Gọi AI tạo bài thi', '4. Nếu lỗi: tạo câu hỏi và lập bài thi', '5. Xác nhận kết quả và cập nhật tiến trình'].join('\n')
      : isQuestionsInit
        ? ['Kế hoạch xử lý:', '1. Xác nhận yêu cầu tạo câu hỏi', '2. Phân tích nội dung và xác định môn học', '3. Gọi AI tạo câu hỏi', '4. Nếu lỗi: sinh từng câu hỏi dự phòng', '5. Xác nhận kết quả và cập nhật tiến trình'].join('\n')
        : ['Kế hoạch xử lý:', '1. Hiển thị yêu cầu', '2. Phân tích prompt', '3. Gọi AI tạo phản hồi', '4. Tổng hợp và hiển thị kết quả', '5. Hoàn tất'].join('\n');
    try {
      const showPlan = typeof localStorage !== 'undefined' ? (localStorage.getItem('ai_plan_enabled') === 'true') : false;
      if (showPlan) {
        const planMsgInit = { id: Date.now() + 49, role: 'ai' as const, content: planTextInit, time: formatTime(new Date()) };
        setAiMessages(prev => [...prev, planMsgInit]);
      }
    } catch { void 0; }
    try {
      let sid = await getAiSubjectId(text);
      if (!sid || sid <= 0) {
        try {
          const created = await subjectsService.createSubject({ name: 'Chung', description: 'Tạo tự động từ AI' });
          sid = created.subjectId;
        } catch (e) {
          console.error('Fallback subject creation failed', e);
          const errMsg = { id: Date.now() + 13, role: "ai" as const, content: 'Không thể xác định môn học để tạo bài thi.', time: formatTime(new Date()) };
          setAiMessages(prev => [...prev, errMsg]);
          setAiSending(false);
          return;
        }
      }
      let aiText = '';
      try {
        if (selectedProvider === 'gemini') {
          aiText = await callGeminiText(text);
        } else if (selectedProvider === 'local') {
          aiText = await callLocalText(text);
        } else {
          aiText = await callOssText(text);
        }
      } catch { aiText = ''; }
      if (!aiText) {
        try {
          const modelsPrim = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
          const keysPrim = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
          for (const k of (keysPrim.length ? keysPrim : [''])) {
            for (const m of modelsPrim) {
              try {
                const r = await questionsService.generateAIQuestionWithModel({ description: text, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 }, m, k);
                if (r && r.content && r.content.toLowerCase().trim() !== text.toLowerCase().trim()) { aiText = String(r.content || ''); break; }
              } catch {}
            }
            if (aiText) break;
          }
          if (!aiText) {
            const r2 = await questionsService.generateAIQuestion({ description: text, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
            if (r2 && r2.content && r2.content.toLowerCase().trim() !== text.toLowerCase().trim()) {
               aiText = String(r2.content || '');
            }
          }
        } catch {}
      }
      const body = String(aiText || '').trim() || 'Xin lỗi, tôi không thể trả lời ngay lúc này. Vui lòng kiểm tra lại API Key hoặc thử lại sau.';
      const aiMsg = { id: Date.now() + 1, role: "ai" as const, content: body, time: formatTime(new Date()) };
      setAiMessages(prev => [...prev, aiMsg]);
      try {
        const lang = (() => { try { const s = text; if (/[\u3040-\u30ff]/.test(s)) return 'ja'; if (/[\u0600-\u06FF]/.test(s)) return 'ar'; if (/[đáâăơưêôàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(s)) return 'vi'; return 'en'; } catch { return 'en'; } })();
        await postAiLog({ prompt: text, response: body, language: lang, isError: false });
      } catch { void 0; }
    } catch {
      const aiMsg = { id: Date.now() + 1, role: "ai" as const, content: 'Xin lỗi, AI không thể phản hồi lúc này.', time: formatTime(new Date()) };
      setAiMessages(prev => [...prev, aiMsg]);
      try { await postAiLog({ prompt: text, response: '', language: 'en', isError: true, errorMessage: 'AI không thể phản hồi' }); } catch { void 0; }
    }
    try {
      const low = text.toLowerCase();
      const noSaveFlag = /(không\s*lưu|khong\s*luu|do\s*not\s*save|don't\s*save|không\s*ghi|khong\s*ghi)/i.test(low);
      const wantsSaveFlag = /(\blưu\b|\bluu\b|\bsave\b|\bghi\b|\bstore\b|\binsert\b)/i.test(low);
      const shouldCreateExam = /tạo\s+bài\s+thi|tao\s+bai\s+thi|create\s+exam/i.test(low);
      if (shouldCreateExam) {
        const baseId = Date.now();
        const steps = [
          { id: baseId + 0, text: 'Lập kế hoạch', status: 'in_progress' as const },
          { id: baseId + 1, text: 'Chuẩn bị tạo bài thi', status: 'pending' as const },
          { id: baseId + 2, text: 'Phân tích nội dung AI', status: 'pending' as const },
          { id: baseId + 3, text: 'Hiển thị câu hỏi', status: 'pending' as const },
          { id: baseId + 4, text: 'Đang tạo bài thi', status: 'pending' as const },
          { id: baseId + 5, text: 'Hoàn tất', status: 'pending' as const },
        ];
        setAiProgress(prev => [...prev, ...steps]);
        const match = low.match(/(\d{1,2})\s*câu|\b(\d{1,2})\b/);
        const count = match ? parseInt(match[1] || match[2], 10) : 5;
        let sid = await getAiSubjectId(text);
        if (!sid || sid <= 0) {
          try {
            const created = await subjectsService.createSubject({ name: 'Chung', description: 'Tạo tự động từ AI' });
            sid = created.subjectId;
          } catch (e) {
            console.error('Fallback subject creation failed', e);
            const errMsg = { id: Date.now() + 14, role: "ai" as const, content: 'Không thể xác định môn học để tạo bài thi.', time: formatTime(new Date()) };
            setAiMessages(prev => [...prev, errMsg]);
            setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
            return;
          }
        }
        const lastAi = [...aiMessages].reverse().find(m => m.role === 'ai');
        const rawCandidate = lastAi ? String(lastAi.content || '').trim() : '';
        const isLikelyJson = (() => {
          if (!rawCandidate) return false;
          const s = rawCandidate.replace(/```json/g, '').replace(/```/g, '').trim();
          if (!s.startsWith('{') || !s.endsWith('}')) return false;
          try { JSON.parse(s); return true; } catch { return false; }
        })();
        const rawText = isLikelyJson ? rawCandidate : '';
        const title = `Bài kiểm tra AI (${count} câu)`;
        const topic = text;
        setAiProgress(prev => prev.map(p => p.id === baseId + 0 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseId + 1 ? { ...p, status: 'in_progress' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseId + 1 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseId + 2 ? { ...p, status: 'in_progress' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseId + 2 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseId + 3 ? { ...p, status: 'in_progress' } : p));
        const modelsG = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
        const keysG = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
        const suggestions: any[] = [];
        const wantMulti = /chọn\s*nhiều|nhiều\s*đáp\s*án|multi\s*select|multiple\s*answers|chọn\s*1\s*hoặc\s*nhiều/i.test(text);
        for (let i = 0; i < count; i++) {
          let sug: any = null;
          const uniqueDesc = `${text} (Question ${i + 1} of ${count} - Make it unique)`;
          for (const k of (keysG.length ? keysG : [''])) {
            for (const m of modelsG) {
              try {
                const actualModel = selectedProvider === 'groq' ? mapDisplayModelToGroq(m) : m;
                if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
                  console.debug('AI suggest try', { provider: selectedProvider, displayModel: m, actualModel, keyTail: (k || '').slice(-6) });
                }
                const r = await questionsService.generateAIQuestionWithModel({ description: uniqueDesc, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1, optionsCount: 4, correctCount: wantMulti ? 2 : 1 }, actualModel, k);
                if (r && r.content) { sug = r; break; }
              } catch (err) {
                if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
                  console.warn('AI suggest error', err);
                }
              }
            }
            if (sug) break;
          }
          if (!sug) {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
              console.debug('AI suggest fallback generateAIQuestion');
            }
            try {
                sug = await questionsService.generateAIQuestion({ description: uniqueDesc, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
            } catch (e) {
                console.warn('Fallback generation failed', e);
                // Create a dummy question to prevent crash
                sug = { 
                    content: `${uniqueDesc}`, 
                    questionType: 'MultipleChoice', 
                    difficulty: 'Medium', 
                    marks: 1, 
                    subjectId: sid, 
                    answerOptions: [
                        { content: 'Option A', isCorrect: true, orderIndex: 1 }, 
                        { content: 'Option B', isCorrect: false, orderIndex: 2 }
                    ] 
                };
            }
          }
          suggestions.push(sug);
        }
        const previewText = ['Xem trước câu hỏi:'].concat(
          suggestions.map((q, i) => {
            const opts = Array.isArray(q.answerOptions) ? q.answerOptions : [];
            const lines = [`${i + 1}. ${String(q.content || '').trim()}`].concat(
              opts.map((op: any, idx: number) => `   ${String.fromCharCode(65 + idx)}. ${String(op.content || '').trim()}${op.isCorrect ? ' (đúng)' : ''}`)
            );
            return lines.join('\n');
          })
        ).join('\n');
        const previewMsg = { id: Date.now() + 7, role: "ai" as const, content: previewText, time: formatTime(new Date()) };
        setAiMessages(prev => [...prev, previewMsg]);
        setAiProgress(prev => prev.map(p => p.id === baseId + 3 ? { ...p, status: 'done' } : p));
        if (noSaveFlag) {
          setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'done' } : p));
          setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: 'Hoàn tất (không lưu)', status: 'done' } : p));
          try { await postAiLog({ prompt: text, response: previewText, language: 'vi', isError: false }); } catch { void 0; }
        } else {
          setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'in_progress' } : p));
          let createdExamId = 0;
          let createdCount = 0;
          try {
          const createdIds: number[] = [];
          for (const sug of suggestions) {
            const created = await questionsService.createQuestion(sug);
            createdIds.push(created.questionId);
          }
          const detail = await examsService.createExam({ title, subjectId: sid, durationMinutes: 10, totalQuestions: createdIds.length, totalMarks: createdIds.length, status: 'Draft', examType: 'Quiz' });
          createdExamId = Number((detail as any)?.id ?? (detail as any)?.ExamId ?? 0);
          if (!createdExamId) {
            throw new Error('Exam creation returned invalid response');
          }
          createdCount = createdIds.length;
          if (createdIds.length) {
            await examsService.addQuestionsFromBank(createdExamId, { questionIds: createdIds, defaultMarks: 1 });
          }
          const confirmMsg = { id: Date.now() + 2, role: "ai" as const, content: `Đã tạo bài thi ID ${createdExamId} với ${createdCount} câu hỏi.`, time: formatTime(new Date()) };
          setAiMessages(prev => [...prev, confirmMsg]);
          setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'done' } : p));
          setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: `Hoàn tất (ID ${createdExamId})`, status: 'done' } : p));
          try { await postAiLog({ prompt: text, response: confirmMsg.content, language: 'vi', isError: false }); } catch { void 0; }
        } catch (err) {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
            console.error('Create exam direct from suggestions failed', err);
          }
          setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'error', text: 'Lỗi tạo bài thi, đang thử cách khác' } : p));
          try {
            const models = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
            const keys = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
            let resAI: { examId: number; title: string; count: number } | null = null;
            for (const k of (keys.length ? keys : [''])) {
              for (const m of models) {
                try {
                  const actualModel = selectedProvider === 'groq' ? mapDisplayModelToGroq(m) : m;
                  if (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') {
                    console.debug('AI exam fallback try', { provider: selectedProvider, displayModel: m, actualModel, keyTail: (k || '').slice(-6) });
                  }
                  const r = await examsService.createExamFromAI({ subjectId: sid, title, topic, count, durationMinutes: 10, marksPerQuestion: 1, rawText }, actualModel, k);
                  if (r && r.examId) { resAI = r; break; }
                } catch {}
              }
              if (resAI) break;
            }
            if (!resAI) throw new Error('AI create exam failed');
            createdExamId = resAI.examId;
            createdCount = resAI.count;
            const confirmMsg = { id: Date.now() + 2, role: "ai" as const, content: `Đã tạo bài thi ID ${createdExamId} với ${createdCount} câu hỏi (fallback).`, time: formatTime(new Date()) };
            setAiMessages(prev => [...prev, confirmMsg]);
            setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'done' } : p));
            setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: `Hoàn tất (ID ${createdExamId})`, status: 'done' } : p));
            try { await postAiLog({ prompt: text, response: confirmMsg.content, language: 'vi', isError: false }); } catch { void 0; }
          } catch (fallbackErr) {
            try {
              const detail = await examsService.createExam({ title, subjectId: sid, durationMinutes: 10, totalQuestions: count, totalMarks: count, status: 'Draft', examType: 'Quiz' });
              createdExamId = Number((detail as any)?.id ?? (detail as any)?.ExamId ?? 0);
              if (!createdExamId) {
                throw new Error('Exam creation returned invalid response');
              }
              const confirmMsg = { id: Date.now() + 2, role: "ai" as const, content: `Đã tạo bài thi ID ${createdExamId} (chưa có câu hỏi).`, time: formatTime(new Date()) };
              setAiMessages(prev => [...prev, confirmMsg]);
              setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'done' } : p));
              setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: `Hoàn tất (ID ${createdExamId})`, status: 'done' } : p));
              try { await postAiLog({ prompt: text, response: confirmMsg.content, language: 'vi', isError: false }); } catch { void 0; }
            } catch (finalErr) {
              console.error('Create exam failed (all attempts)', finalErr);
              const errMsg = { id: Date.now() + 12, role: "ai" as const, content: 'Không thể tạo bài thi.', time: formatTime(new Date()) };
              setAiMessages(prev => [...prev, errMsg]);
              setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
            }
          }
        }
      }
      }
      const shouldCreateQuestions = /tạo\s+câu\s+hỏi|tao\s+cau\s+hoi|create\s+question(s)?/i.test(low);
      if (shouldCreateQuestions) {
        const baseIdQ = Date.now() + 1000;
        const stepsQ = [
          { id: baseIdQ + 0, text: 'Lập kế hoạch', status: 'in_progress' as const },
          { id: baseIdQ + 1, text: 'Chuẩn bị tạo câu hỏi', status: 'pending' as const },
          { id: baseIdQ + 2, text: 'Phân tích nội dung AI', status: 'pending' as const },
          { id: baseIdQ + 3, text: 'Hiển thị câu hỏi', status: 'pending' as const },
          { id: baseIdQ + 4, text: 'Đang tạo câu hỏi', status: 'pending' as const },
          { id: baseIdQ + 5, text: 'Hoàn tất', status: 'pending' as const },
        ];
        setAiProgress(prev => [...prev, ...stepsQ]);
        const matchQ = low.match(/(\d{1,2})\s*câu|\b(\d{1,2})\b/);
        const countQ = matchQ ? parseInt(matchQ[1] || matchQ[2], 10) : 5;
        let sidQ = await getAiSubjectId(text);
        if (!sidQ || sidQ <= 0) {
          try {
            const created = await subjectsService.createSubject({ name: 'Chung', description: 'Tạo tự động từ AI' });
            sidQ = created.subjectId;
          } catch (e) {
            console.error('Fallback subject creation failed for questions', e);
            setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
            const errMsg = { id: Date.now() + 15, role: "ai" as const, content: 'Không thể xác định môn học để tạo câu hỏi.', time: formatTime(new Date()) };
            setAiMessages(prev => [...prev, errMsg]);
            return;
          }
        }
        const lastAiQ = [...aiMessages].reverse().find(m => m.role === 'ai');
        const rawCandidateQ = lastAiQ ? String(lastAiQ.content || '').trim() : '';
        const isLikelyJsonQ = (() => {
          if (!rawCandidateQ) return false;
          const s = rawCandidateQ.replace(/```json/g, '').replace(/```/g, '').trim();
          if (!s.startsWith('{') || !s.endsWith('}')) return false;
          try { JSON.parse(s); return true; } catch { return false; }
        })();
        const rawTextQ = isLikelyJsonQ ? rawCandidateQ : '';
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 0 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 1 ? { ...p, status: 'in_progress' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 1 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 2 ? { ...p, status: 'in_progress' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 2 ? { ...p, status: 'done' } : p));
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 3 ? { ...p, status: 'in_progress' } : p));
        const modelsPreview = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
        const keysPreview = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
        const previewSuggestions: any[] = [];
        for (let i = 0; i < countQ; i++) {
          let sug: any = null;
          for (const k of (keysPreview.length ? keysPreview : [''])) {
            for (const m of modelsPreview) {
              try {
                const r = await questionsService.generateAIQuestionWithModel({ description: text, subjectId: sidQ, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 }, m, k);
                if (r && r.content) { sug = r; break; }
              } catch {}
            }
            if (sug) break;
          }
          if (!sug) {
            sug = await questionsService.generateAIQuestion({ description: text, subjectId: sidQ, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
          }
          previewSuggestions.push(sug);
        }
        const previewTextQ = ['Xem trước câu hỏi:'].concat(
          previewSuggestions.map((q, i) => {
            const opts = Array.isArray(q.answerOptions) ? q.answerOptions : [];
            const lines = [`${i + 1}. ${String(q.content || '').trim()}`].concat(
              opts.map((op: any, idx: number) => `   ${String.fromCharCode(65 + idx)}. ${String(op.content || '').trim()}${op.isCorrect ? ' (đúng)' : ''}`)
            );
            return lines.join('\n');
          })
        ).join('\n');
        const previewMsgQ = { id: Date.now() + 8, role: "ai" as const, content: previewTextQ, time: formatTime(new Date()) };
        setAiMessages(prev => [...prev, previewMsgQ]);
        setAiProgress(prev => prev.map(p => p.id === baseIdQ + 3 ? { ...p, status: 'done' } : p));
        if (!wantsSaveFlag || noSaveFlag) {
          setAiProgress(prev => prev.map(p => p.id === baseIdQ + 4 ? { ...p, status: 'done' } : p));
          setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: 'Hoàn tất (không lưu)', status: 'done' } : p));
          try { await postAiLog({ prompt: text, response: previewTextQ, language: 'vi', isError: false }); } catch { void 0; }
        } else {
          setAiProgress(prev => prev.map(p => p.id === baseIdQ + 4 ? { ...p, status: 'in_progress' } : p));
          try {
            const models = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
            const keys = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
            let resAICreate: { count: number; questionIds: number[] } | null = null;
            for (const k of (keys.length ? keys : [''])) {
              for (const m of models) {
                try {
                  const r = await questionsService.createQuestionsFromAI({ subjectId: sidQ, topic: text, count: countQ, rawText: rawTextQ }, m, k);
                  if (r && r.count) { resAICreate = r; break; }
                } catch {}
              }
              if (resAICreate) break;
            }
            if (resAICreate) {
              const msgQ = { id: Date.now() + 3, role: "ai" as const, content: `Đã tạo ${resAICreate.count} câu hỏi.`, time: formatTime(new Date()) };
              setAiMessages(prev => [...prev, msgQ]);
              setAiProgress(prev => prev.map(p => p.id === baseIdQ + 4 ? { ...p, status: 'done' } : p));
              setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: `Hoàn tất (${resAICreate.count} câu hỏi)`, status: 'done' } : p));
              try { await postAiLog({ prompt: text, response: msgQ.content, language: 'vi', isError: false }); } catch { void 0; }
              return;
            }
            const createdIdsQ: number[] = [];
            for (const sug of previewSuggestions) {
              const created = await questionsService.createQuestion(sug);
              createdIdsQ.push(created.questionId);
            }
            const resQ = { count: createdIdsQ.length, questionIds: createdIdsQ };
            const msgQ = { id: Date.now() + 3, role: "ai" as const, content: `Đã tạo ${resQ.count} câu hỏi.`, time: formatTime(new Date()) };
            setAiMessages(prev => [...prev, msgQ]);
            setAiProgress(prev => prev.map(p => p.id === baseIdQ + 4 ? { ...p, status: 'done' } : p));
            setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: `Hoàn tất (${resQ.count} câu hỏi)`, status: 'done' } : p));
            try { await postAiLog({ prompt: text, response: msgQ.content, language: 'vi', isError: false }); } catch { void 0; }
          } catch {
          let created = 0;
          for (let i = 0; i < countQ; i++) {
            try {
              const sug = await questionsService.generateAIQuestion({ description: text, subjectId: sidQ, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
              await questionsService.createQuestion(sug);
              created++;
          } catch {
              const sug2 = await questionsService.generateAIQuestion({ description: 'Câu hỏi trắc nghiệm mẫu', subjectId: sidQ, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
              await questionsService.createQuestion(sug2);
              created++;
          }
          }
          const msgQ = { id: Date.now() + 3, role: "ai" as const, content: `Đã tạo ${created} câu hỏi (fallback).`, time: formatTime(new Date()) };
          setAiMessages(prev => [...prev, msgQ]);
          setAiProgress(prev => prev.map(p => p.id === baseIdQ + 4 ? { ...p, status: 'done' } : p));
          setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: `Hoàn tất (${created} câu hỏi)`, status: 'done' } : p));
          try { await postAiLog({ prompt: text, response: msgQ.content, language: 'vi', isError: false }); } catch { void 0; }
          }
        }
      }
      const shouldShowEndpoints = /\bendpoint(s)?\b|danh\s*sách\s*endpoint|api\s*endpoints|help|hướng\s*dẫn/i.test(low);
      if (shouldShowEndpoints) {
        const sidH = await getAiSubjectId(text);
        const msg = [
          'Các endpoint AI hiện có:',
          '- Tạo bài thi: POST /api/Exams/ai-create',
          '- Tạo câu hỏi: POST /api/question-bank/ai-create-questions',
          '- Sinh một câu hỏi: POST /api/question-bank/generate-ai',
          '',
          'Payload mẫu tạo bài thi:',
          '{ "subjectId": ' + String(sidH) + ', "title": "Bài kiểm tra AI", "topic": "chủ đề", "count": 5, "durationMinutes": 10, "marksPerQuestion": 1, "rawText": "<nội dung AI>" }',
          '',
          'Payload mẫu tạo câu hỏi:',
          '{ "subjectId": ' + String(sidH) + ', "topic": "chủ đề", "count": 5, "rawText": "<nội dung AI>" }'
        ].join('\n');
        const helpMsg = { id: Date.now() + 4, role: "ai" as const, content: msg, time: formatTime(new Date()) };
        setAiMessages(prev => [...prev, helpMsg]);
      }

      const direct1 = text.match(/\b(get|post|put|delete)\b\s*(\d{3,5})\s*([^\s]+)(?:\s+body\s*:\s*(\{[\s\S]*\}))?/i);
      const direct2 = text.match(/\b(gọi|goi|call)\b\s*(get|post|put|delete)\b\s*(?:port\s*)?(\d{3,5})\s*([^\s]+)(?:\s+body\s*:\s*(\{[\s\S]*\}))?/i);
      const m = direct1 || direct2;
      if (m) {
        const method = (direct1 ? m[1] : m[2]).toUpperCase();
        const port = parseInt(direct1 ? m[2] : m[3], 10);
        const path = String(direct1 ? m[3] : m[4]);
        const bodyRaw = (direct1 ? m[4] : m[5]) || '';
        const url = `http://localhost:${port}${path.startsWith('/') ? path : '/' + path}`;
        let resObj: any = null;
        try {
          if (method === 'GET') {
            resObj = await apiService.get<any>(url);
          } else if (method === 'POST') {
            let body: any = undefined;
            if (bodyRaw) {
              try { body = JSON.parse(bodyRaw); } catch { body = bodyRaw; }
            }
            resObj = await apiService.post<any>(url, body);
          } else if (method === 'PUT') {
            let body: any = undefined;
            if (bodyRaw) {
              try { body = JSON.parse(bodyRaw); } catch { body = bodyRaw; }
            }
            resObj = await apiService.put<any>(url, body);
          } else if (method === 'DELETE') {
            resObj = await apiService.delete<any>(url);
          }
        } catch (e: any) {
          const errText = (e?.message || 'Lỗi gọi endpoint');
          const msg = { id: Date.now() + 5, role: "ai" as const, content: errText, time: formatTime(new Date()) };
          setAiMessages(prev => [...prev, msg]);
          try { await postAiLog({ prompt: text, response: errText, language: 'vi', isError: true }); } catch { void 0; }
          throw e;
        }
        const preview = (() => { try { return JSON.stringify(resObj, null, 2).slice(0, 3000); } catch { return String(resObj); } })();
        const msg = { id: Date.now() + 6, role: "ai" as const, content: preview || 'OK', time: formatTime(new Date()) };
        setAiMessages(prev => [...prev, msg]);
        try { await postAiLog({ prompt: text, response: preview, language: 'vi', isError: false }); } catch { void 0; }
      }
    } catch { void 0; }
    setAiSending(false);
  };

  /**
   * Check if message is from admin
   */
  const getAdminId = (): number => {
    const keys = ['auth_user', 'user', 'authUser', 'USER', 'USER_INFO'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const u = JSON.parse(raw);
        let id = u.id ?? u.userId ?? u.UserId;
        if (typeof id === 'string') id = parseInt(id, 10);
        if (typeof id === 'number' && !Number.isNaN(id)) return id;
      } catch {}
    }
    try {
      const tok = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      if (tok.includes('.')) {
        const [, payload] = tok.split('.');
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        let sub: any = json.sub ?? json.nameid ?? json.NameId ?? json.userId ?? json.UserId;
        if (typeof sub === 'string') sub = parseInt(sub, 10);
        if (typeof sub === 'number' && !Number.isNaN(sub)) return sub;
      }
    } catch {}
    return 0;
  };

  const isAdminMessage = (message: ChatMessage): boolean => {
    const adminId = getAdminId();
    let senderId: any = message.senderId;
    if (typeof senderId === 'string') {
      const n = parseInt(senderId, 10);
      senderId = Number.isNaN(n) ? senderId : n;
    }
    if (typeof adminId === 'number' && typeof senderId === 'number' && adminId && senderId && senderId === adminId) {
      return true;
    }
    const raw = localStorage.getItem('authUser') || localStorage.getItem('auth_user') || localStorage.getItem('USER_INFO') || localStorage.getItem('user') || localStorage.getItem('USER') || '';
    let adminName = '';
    try {
      const u = raw ? JSON.parse(raw) : null;
      adminName = (u?.fullName || u?.username || '').toString();
    } catch {}
    const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const sName = (message.senderName || '').toString();
    if (sName && adminName && strip(sName) === strip(adminName)) return true;
    if (strip(sName) === 'admin') return true;
    return false;
  };

  /**
   * Format time
   */
  if (isAIChat) {
    return (
      <>
        <PageMeta title="AI Assistant" description="Trao đổi với AI và tạo bài thi/câu hỏi" />
        <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V2M12 22V20M4 12H2M22 12H20M18 18L16.5 16.5M18 6L16.5 7.5M6 18L7.5 16.5M6 6L7.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
                  </svg>
                </div>
                AI Assistant
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-1">Powered by Phuong</p>
            </div>
            
            <div className="relative z-50">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setModelOpen(!modelOpen)} 
              className="shadow-sm hover:shadow transition-all bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3a9 9 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
                <span className="max-w-[150px] truncate">{selectedModel || 'Change Model'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </Button>

            <Dropdown isOpen={modelOpen} onClose={() => setModelOpen(false)} className="w-72 max-h-[80vh] overflow-y-auto right-0 mt-2 p-2 !z-50 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="space-y-1">
                  {/* Local */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Local Model</div>
                  <button 
                    onClick={() => handleSelectModel('Llama-3-8B-Local', 'local')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                      selectedModel === 'Llama-3-8B-Local' && selectedProvider === 'local'
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="truncate mr-2">Llama-3-8B-Local</span>
                    {selectedModel === 'Llama-3-8B-Local' && selectedProvider === 'local' && (
                      <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    )}
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

                  {/* Gemini */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gemini</div>
                  {getAllGeminiModels().map(m => (
                    <button 
                      key={m}
                      onClick={() => handleSelectModel(m, 'gemini')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                        selectedModel === m && selectedProvider === 'gemini'
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="truncate mr-2">{m}</span>
                      {selectedModel === m && selectedProvider === 'gemini' && (
                        <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </button>
                  ))}
                  
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2"></div>

                  {/* OSS */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Source</div>
                  {getAllOssModels().map(m => (
                    <button 
                      key={m}
                      onClick={() => handleSelectModel(m, 'groq')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                        selectedModel === m && selectedProvider === 'groq'
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="truncate mr-2">{m}</span>
                      {selectedModel === m && selectedProvider === 'groq' && (
                        <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </button>
                  ))}
                </div>
            </Dropdown>
            </div>
          </div>

          {/* Main Chat Container */}
          <main className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden relative backdrop-blur-sm">
            
            {/* Messages Area */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
              {aiMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/20 dark:to-brand-800/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-500">
                       <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.343 7.343l.707.707m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">How can I help you today?</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8">I can help generate exams, create questions from text, or answer inquiries about the system.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {[
                      { icon: '📝', text: 'Tạo bài thi 10 câu về Lịch sử Việt Nam' },
                      { icon: '❓', text: 'Tạo 5 câu hỏi trắc nghiệm Toán lớp 12' },
                      { icon: '💡', text: 'Gợi ý chủ đề bài thi Vật lý' },
                      { icon: '🔧', text: 'Hướng dẫn sử dụng API endpoints' }
                    ].map((item, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setAiInput(item.text)}
                        className="p-4 text-left rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
                      >
                        <span className="text-xl mb-2 block">{item.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {aiMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-brand-600 text-white' 
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-brand-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 12a10.1 10.1 0 0 0 13.2 5.6"/></svg>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div className={`max-w-[85%] lg:max-w-[75%] group relative`}>
                        <div className={`p-4 md:p-5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{String(msg.content || '')}</p>
                        </div>
                        <div className={`mt-1.5 flex items-center gap-2 text-xs text-gray-400 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {/* Thinking/Processing State */}
              {(aiSending || aiProgress.length > 0) && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/></svg>
                   </div>
                   <div className="flex-1 max-w-md">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                         <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                              </span>
                              AI is processing...
                            </span>
                            <button onClick={() => setShowFooterProgress(!showFooterProgress)} className="text-gray-400 hover:text-gray-600">
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transform transition-transform ${showFooterProgress ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                         </div>
                         
                         {showFooterProgress && (
                           <div className="space-y-3">
                             {aiProgress.slice(-4).map((step) => (
                               <div key={step.id} className="flex items-start gap-3 text-sm">
                                  <div className="mt-1">
                                    {step.status === 'done' ? (
                                      <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                                      </div>
                                    ) : step.status === 'error' ? (
                                      <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">✕</div>
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
                                    )}
                                  </div>
                                  <span className={`${step.status === 'done' ? 'text-gray-500 line-through opacity-60' : 'text-gray-700 dark:text-gray-200 font-medium'}`}>
                                    {step.text}
                                  </span>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
              <div className="max-w-4xl mx-auto">
                <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all shadow-sm">
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAiMessage();
                      }
                    }}
                    placeholder="Type your message here..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[60px] max-h-40 py-4 pl-4 pr-14 text-gray-900 dark:text-white placeholder-gray-400 text-[15px]"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button 
                      onClick={sendAiMessage} 
                      disabled={!aiInput.trim() || aiSending} 
                      className={`w-10 h-10 !p-0 rounded-xl flex items-center justify-center transition-all ${aiInput.trim() ? 'bg-brand-600 hover:bg-brand-700 shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}
                    >
                      {aiSending ? (
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-0.5 mt-0.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                  AI can generate incorrect information. Check important info.
                </p>
              </div>
            </div>
          </main>

          {/* Modal Removed */}
        </div>
      </>
    );
  }

  /**
   * Get display name for sender
   */
  const getSenderDisplayName = (message: ChatMessage): string => {
    if (isAdminMessage(message)) return 'Bạn';
    return message.senderName || 'User';
  };

  return (
    <>
      <PageMeta title="Quản lý tin nhắn hỗ trợ" description="Theo dõi và quản trị cuộc hội thoại" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Quản lý tin nhắn hỗ trợ</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Room List */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <input
                placeholder="Tìm phòng chat..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>

            {isLoading && !rooms.length ? (
              <div className="p-8 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" />
                <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">Không có phòng chat nào</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredRooms.map((room) => (
                  <div
                    key={room.roomId}
                    onClick={() => setActiveRoomId(room.roomId)}
                    className={`
                      flex items-center gap-3 p-3 cursor-pointer transition-colors
                      border-b border-gray-50 dark:border-gray-800
                      hover:bg-gray-50 dark:hover:bg-gray-800
                      ${activeRoomId === room.roomId ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                        {room.creatorName[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {formatRoomName(room.name)}
                        </p>
                        {room.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTime(room.lastMessage.sentAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {room.lastMessage?.content || 'Chưa có tin nhắn'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Chat Area */}
          <main className="lg:col-span-8 xl:col-span-9 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden bg-white dark:bg-gray-900 flex flex-col" style={{ height: '650px' }}>
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <header className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                      {activeRoom.creatorName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatRoomName(activeRoom.name)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activeRoom.description || `User ID: ${activeRoom.createdBy}`}
                      </p>
                    </div>
                  </div>
                </header>

                {/* Messages */}
                <div ref={listRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                  {isLoading && !messages.length ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" />
                        <p className="mt-2 text-sm text-gray-500">Đang tải tin nhắn...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <UserCircleIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có tin nhắn</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const fromMe = isAdminMessage(msg);
                      return (
                        <div
                          key={msg.messageId}
                          className={`flex ${fromMe ? 'justify-end items-end' : 'justify-start items-start'} gap-2`}
                        >
                          <div className={`${fromMe ? 'order-1' : 'order-2'} max-w-[85%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[60%]`}>
                            {!fromMe && (
                              <p className="text-xs text-gray-500 mb-1 px-1">
                                {getSenderDisplayName(msg)}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2 shadow-sm ${fromMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'}`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                            <p className={`text-xs text-gray-400 mt-1 px-1 ${fromMe ? 'text-right' : 'text-left'}`}>
                              {formatTime(msg.sentAt)}
                              {msg.isEdited && ' (đã chỉnh sửa)'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700 disabled:opacity-50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isSending}
                      className="px-4 py-2.5 min-w-[80px]"
                    >
                      {isSending ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        </span>
                      ) : (
                        'Gửi'
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <UserCircleIcon className="w-20 h-20 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chọn một phòng chat để bắt đầu</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
