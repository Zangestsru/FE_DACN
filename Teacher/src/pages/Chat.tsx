import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { UserCircleIcon } from "../icons";
import { chatService } from "../services/chat.service";
import { ChatMessage, ChatRoom } from "../types/chat.types";
import { questionsService } from "../services/questions.service";
import { subjectsService } from "../services/subjects.service";
import apiService from "../services/api.service";
import { API_ENDPOINTS } from "../config/api.config";
import examsService from "../services/exams.service";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  // Allow toggling via state or route
  const [isAIChat, setIsAIChat] = useState(location.pathname.includes("/ai-chat"));

  // Update isAIChat if location changes
  useEffect(() => {
    setIsAIChat(location.pathname.includes("/ai-chat"));
  }, [location.pathname]);

  const geminiModelEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env ? (((import.meta as any).env.VITE_GEMINI_MODEL || '') as string).trim() : '') as string;
  const geminiModelLS = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '';
  const geminiModel = geminiModelEnv || geminiModelLS || 'gemini-2.5-pro';
  
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
  const AI_STORAGE_KEY = "teacher_ai_chat_messages";
  const [showFooterProgress, setShowFooterProgress] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [lastNewMessageId, setLastNewMessageId] = useState<number | null>(null);

  const resolveInitialProviderAndModel = (): { provider: 'gemini' | 'groq'; model: string } => {
    const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
    const provLS = (typeof localStorage !== 'undefined' ? (localStorage.getItem('ai_provider') || '') : '').toLowerCase();
    const groqKeyEnv = String((envAny.VITE_GROQ_API_KEY || envAny.VITE_OSS_API_KEY || '')).trim();
    const groqKeyLS = typeof localStorage !== 'undefined' ? String((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '')).trim() : '';
    const groqModelEnv = String((envAny.VITE_GROQ_MODEL || envAny.VITE_OSS_MODEL || '')).trim();
    const groqModelLS = typeof localStorage !== 'undefined' ? String((localStorage.getItem('oss_model') || localStorage.getItem('groq_model') || '')).trim() : '';
    const groqModelInit = groqModelEnv || groqModelLS || 'llama-3.3-70b-versatile';
    const gemModelInit = geminiModel;
    const preferGroq = provLS.includes('groq') || (groqKeyEnv.length > 20) || (groqKeyLS.length > 20);
    return preferGroq ? { provider: 'groq', model: groqModelInit } : { provider: 'gemini', model: gemModelInit };
  };

  const init = resolveInitialProviderAndModel();
  const [selectedModel, setSelectedModel] = useState<string>(init.model);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'groq'>(init.provider);

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
      // Always use MultipleChoice to ensure backend compatibility
      const payload = { description: prompt, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 } as any;
      const tryParseRaw = (raw: any): string => {
        try {
          const s = String(raw || '').trim();
          if (!s) return '';
          const clean = s.replace(/```json/g, '').replace(/```/g, '').trim();
          const obj = JSON.parse(clean);
          if (obj.candidates) {
            const parts = (((obj?.candidates?.[0]?.content?.parts) || []) as any[]).map(p => String(p?.text || ''));
            const text = parts.filter(Boolean).join('\n').trim();
            if (text) return text;
          }
          if (obj.content || obj.Content) {
             return String(obj.content || obj.Content || '').trim();
          }
          if (obj.text || obj.message) return String(obj.text || obj.message);
          return '';
        } catch { 
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

  const filteredRooms = useMemo(
    () => rooms.filter((room) => 
      room.name.toLowerCase().includes(query.toLowerCase()) ||
      (room.creatorName && room.creatorName.toLowerCase().includes(query.toLowerCase()))
    ),
    [rooms, query]
  );

  const activeRoom = useMemo(
    () => rooms.find(r => r.roomId === activeRoomId),
    [rooms, activeRoomId]
  );

  useEffect(() => {
    if (!isAIChat) {
      loadRooms();
      chatService.connect().then(() => setSignalRConnected(true)).catch(() => setSignalRConnected(false));
      
      const unsubscribe = chatService.onMessageReceived((message) => {
        // Update messages for current room
        setMessages(prev => {
          if (activeRoomId && message.roomId !== activeRoomId) return prev;
          if (prev.find(m => m.messageId === message.messageId)) return prev;
          // Mark as new message for visual effect
          setLastNewMessageId(message.messageId);
          setTimeout(() => setLastNewMessageId(null), 3000);
          return [...prev, message];
        });

        // Update rooms list
        setRooms(prevRooms => {
          const roomIndex = prevRooms.findIndex(r => r.roomId === message.roomId);
          if (roomIndex > -1) {
            const updatedRoom = { ...prevRooms[roomIndex], lastMessage: message };
            const newRooms = [...prevRooms];
            newRooms.splice(roomIndex, 1);
            return [updatedRoom, ...newRooms];
          } else {
            loadRooms();
            return prevRooms;
          }
        });
      });
      return () => {
        unsubscribe();
        // Do not disconnect here
      };
    }
  }, [isAIChat]);

  useEffect(() => {
    if (!isAIChat && activeRoomId) {
      loadChatHistory(activeRoomId);
    }
  }, [activeRoomId, isAIChat]);

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

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      // Use getUserRooms for Teacher
      const myRooms = await chatService.getUserRooms(1, 100);
      if (myRooms && Array.isArray(myRooms)) {
        // Sort by last message time
        const sorted = myRooms.sort((a, b) => new Date(b.lastMessage?.sentAt || b.createdAt).getTime() - new Date(a.lastMessage?.sentAt || a.createdAt).getTime());
        setRooms(sorted);
        
        if (sorted.length > 0 && !activeRoomId) {
          setActiveRoomId(sorted[0].roomId);
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

  const loadChatHistory = async (roomId: number) => {
    setIsLoading(true);
    try {
      await chatService.joinChatRoom(roomId);
      const history = await chatService.getChatHistory(roomId, 1, 100);
      if (history && history.messages) {
        setMessages(history.messages);
      } else if (Array.isArray(history)) {
          setMessages(history as any);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeRoomId || isSending) return;
    const messageContent = input.trim();
    setInput("");
    setIsSending(true);
    try {
      // Teacher API requires { content, messageType }
      const sent = await chatService.sendMessage(activeRoomId, { content: messageContent, messageType: 'text' });
      if (sent) {
        setMessages(prev => {
          if (prev.find(m => m.messageId === sent.messageId)) return prev;
          return [...prev, sent];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setInput(messageContent);
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
                const r = await questionsService.generateAIQuestionWithModel({ description: uniqueDesc, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1, optionsCount: 4, correctCount: wantMulti ? 2 : 1 }, actualModel, k);
                if (r && r.content) { sug = r; break; }
              } catch {}
            }
            if (sug) break;
          }
          if (!sug) {
            try {
                sug = await questionsService.generateAIQuestion({ description: uniqueDesc, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
            } catch (e) {
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
          setAiProgress(prev => prev.map(p => p.id === baseId + 4 ? { ...p, status: 'error', text: 'Lỗi tạo bài thi, đang thử cách khác' } : p));
          try {
            const models = selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels();
            const keys = selectedProvider === 'gemini' ? getAllGeminiKeys() : getAllOssKeys();
            let resAI: { examId: number; title: string; count: number } | null = null;
            for (const k of (keys.length ? keys : [''])) {
              for (const m of models) {
                try {
                  const actualModel = selectedProvider === 'groq' ? mapDisplayModelToGroq(m) : m;
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
             const errMsg = { id: Date.now() + 12, role: "ai" as const, content: 'Không thể tạo bài thi.', time: formatTime(new Date()) };
             setAiMessages(prev => [...prev, errMsg]);
             setAiProgress(prev => prev.map(p => p.id === baseId + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
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
            setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
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
            setAiProgress(prev => prev.map(p => p.id === baseIdQ + 5 ? { ...p, text: 'Hoàn tất (thất bại)', status: 'error' } : p));
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

  const getCurrentUserId = (): number => {
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
    return 0;
  };

  const isMe = (message: ChatMessage): boolean => {
    const myId = getCurrentUserId();
    let senderId: any = message.senderId;
    if (typeof senderId === 'string') {
      const n = parseInt(senderId, 10);
      senderId = Number.isNaN(n) ? senderId : n;
    }
    if (typeof myId === 'number' && typeof senderId === 'number' && myId && senderId && senderId === myId) {
      return true;
    }
    const raw = localStorage.getItem('authUser') || localStorage.getItem('auth_user') || localStorage.getItem('USER_INFO') || localStorage.getItem('user') || localStorage.getItem('USER') || '';
    let myName = '';
    try {
      const u = raw ? JSON.parse(raw) : null;
      myName = (u?.fullName || u?.username || '').toString();
    } catch {}
    const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const sName = (message.senderName || '').toString();
    if (sName && myName && strip(sName) === strip(myName)) return true;
    return false;
  };
  
  const getSenderName = (msg: ChatMessage) => {
    if (isMe(msg)) return "Bạn";
    return msg.senderName || "User";
  };

  if (isAIChat) {
    return (
      <>
        <PageMeta title="AI Assistant" description="Trao đổi với AI và tạo bài thi/câu hỏi" />
        <div className="h-[calc(100vh-100px)] flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-1">Powered by Gemini & Groq</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsAIChat(false); navigate('/chat'); }}>
                    Back to Chat
                </Button>
                <Button variant="outline" size="sm" onClick={() => setModelOpen(true)}>
                    Change Model
                </Button>
            </div>
          </div>

          <main className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden relative backdrop-blur-sm">
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
              {aiMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">How can I help you today?</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                    {[
                      { icon: '📝', text: 'Tạo bài thi 10 câu về Lịch sử Việt Nam' },
                      { icon: '❓', text: 'Tạo 5 câu hỏi trắc nghiệm Toán lớp 12' },
                      { icon: '💡', text: 'Gợi ý chủ đề bài thi Vật lý' },
                      { icon: '🔧', text: 'Hướng dẫn sử dụng API endpoints' }
                    ].map((item, idx) => (
                      <button key={idx} onClick={() => setAiInput(item.text)} className="p-4 text-left rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                        <span className="mr-2">{item.icon}</span> {item.text}
                      </button>
                    ))}
                   </div>
                </div>
              ) : (
                aiMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                ))
              )}
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
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !aiSending && sendAiMessage()}
                  placeholder="Nhập yêu cầu của bạn..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  disabled={aiSending}
                />
                <Button onClick={sendAiMessage} disabled={aiSending || !aiInput.trim()}>
                  {aiSending ? '...' : 'Gửi'}
                </Button>
              </div>
            </div>
          </main>

          <Modal isOpen={modelOpen} onClose={() => setModelOpen(false)}>
             <h3 className="text-lg font-semibold mb-4">Select AI Model</h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedProvider('gemini')} className={`px-4 py-2 rounded-lg border ${selectedProvider === 'gemini' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200'}`}>Gemini</button>
                        <button onClick={() => setSelectedProvider('groq')} className={`px-4 py-2 rounded-lg border ${selectedProvider === 'groq' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200'}`}>Groq / OSS</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2">
                        {(selectedProvider === 'gemini' ? getAllGeminiModels() : getAllOssModels()).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setModelOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                         try { 
                            localStorage.setItem('ai_provider', selectedProvider); 
                            if (selectedProvider === 'gemini') { 
                              localStorage.setItem('gemini_model', selectedModel); 
                            } else { 
                              localStorage.setItem('oss_model', selectedModel); 
                            } 
                          } catch {} 
                          setModelOpen(false);
                    }}>Save</Button>
                </div>
             </div>
          </Modal>
        </div>
      </>
    );
  }

  // Regular Chat UI (Teacher)
  return (
    <>
      <PageMeta title="Tư vấn & Hỗ trợ học viên" description="Chat hỗ trợ học viên" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Tư vấn & Hỗ trợ học viên</h1>
            <Button variant="outline" onClick={() => setIsAIChat(true)}>
                Switch to AI Assistant
            </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 h-[calc(100vh-140px)]">
          {/* Room List */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden flex flex-col h-full bg-white dark:bg-gray-900">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <input
                placeholder="Tìm cuộc trò chuyện..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            
            {isLoading && !rooms.length ? (
              <div className="p-8 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-brand-600 rounded-full" />
                <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {filteredRooms.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => setActiveRoomId(room.roomId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 ${
                      activeRoomId === room.roomId ? "bg-brand-50 dark:bg-brand-900/20" : ""
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {room.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <div className="font-medium truncate text-gray-900 dark:text-gray-100">{formatRoomName(room.name)}</div>
                        {room.lastMessage && (
                          <div className="text-[10px] text-gray-400 shrink-0 ml-2">
                            {formatTime(room.lastMessage.sentAt)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate h-4">
                        {room.lastMessage ? (
                          <span>
                            {isMe(room.lastMessage) ? "Bạn: " : ""}
                            {room.lastMessage.content}
                          </span>
                        ) : (
                          <span className="italic opacity-70">Chưa có tin nhắn</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Chat Area */}
          <section className="lg:col-span-8 xl:col-span-9 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {activeRoom ? (
              <>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                      {activeRoom.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatRoomName(activeRoom.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activeRoom.description || "Hỗ trợ học viên"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${signalRConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">{signalRConnected ? 'SignalR Connected' : 'Disconnected'}</span>
                  </div>
                </div>

                <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                  {isLoading && !messages.length ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((m) => {
                      const fromMe = isMe(m);
                      const isNew = lastNewMessageId === m.messageId;
                      return (
                        <div key={m.messageId} className={`flex ${fromMe ? "justify-end items-end" : "justify-start items-start"} gap-2 ${isNew ? 'animate-pulse' : ''}`}>
                          {!fromMe && (
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                               {m.senderAvatar ? (
                                 <img src={m.senderAvatar} alt={getSenderName(m)} className="h-full w-full object-cover" />
                               ) : (
                                 <span className="text-xs font-semibold text-gray-500">{getSenderName(m)[0]?.toUpperCase()}</span>
                               )}
                            </div>
                          )}
                          <div className={`${fromMe ? 'order-1' : 'order-2'} max-w-[85%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[60%]`}>
                            {!fromMe && (
                              <p className="text-xs text-gray-500 mb-1 px-1">
                                {getSenderName(m)}
                              </p>
                            )}
                            <div className={`rounded-2xl px-4 py-2 shadow-sm ${
                              fromMe
                                ? "bg-brand-600 text-white rounded-br-none"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none ring-1 ring-gray-100 dark:ring-gray-700"
                            }`}>
                              {m.replyToMessage && (
                                <div className={`mb-2 p-2 rounded text-xs border-l-2 ${fromMe ? 'bg-brand-700/50 border-white/50' : 'bg-gray-100 dark:bg-gray-700 border-gray-300'}`}>
                                  <div className="font-medium opacity-80">{m.replyToMessage.senderName}</div>
                                  <div className="truncate opacity-70">{m.replyToMessage.content}</div>
                                </div>
                              )}
                              
                              {m.messageType === 'image' && m.attachmentUrl ? (
                                <img src={m.attachmentUrl} alt="Attachment" className="max-w-full rounded-lg mb-1" />
                              ) : m.messageType === 'file' && m.attachmentUrl ? (
                                <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline decoration-dotted">
                                  📎 {m.attachmentName || 'File đính kèm'}
                                </a>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                              )}
                            </div>
                            <p className={`text-[10px] text-gray-400 mt-1 px-1 flex gap-1 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                              <span>{new Date(m.sentAt).toLocaleString()}</span>
                              {m.isEdited && <span className="italic">(đã chỉnh sửa)</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="text-4xl mb-2">💬</div>
                      <div className="text-sm">Bắt đầu cuộc trò chuyện với học viên</div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <Button onClick={sendMessage} className="px-6">Gửi</Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <UserCircleIcon className="h-10 w-10 text-gray-300" />
                </div>
                <div className="text-lg font-medium text-gray-500">Chọn một cuộc trò chuyện</div>
                <div className="text-sm mt-1">Chọn từ danh sách bên trái để bắt đầu tư vấn</div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
