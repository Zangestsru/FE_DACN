import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { questionsService } from "../services/questions.service";
import { subjectsService } from "../services/subjects.service";
import apiService from "../services/api.service";

type Role = "user" | "ai";
type AiMessage = { id: number; role: Role; content: string; time: string };

type AiChatState = {
  messages: AiMessage[];
  sending: boolean;
  progressStep: number;
  input: string;
  setInput: (v: string) => void;
  send: (text?: string) => Promise<void>;
  clear: () => void;
};

const AiChatContext = createContext<AiChatState | null>(null);

const STORAGE_KEY = "tailadmin_ai_chat_messages";

const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const geminiKeyEnv = (typeof import.meta !== "undefined" && (import.meta as any).env ? (((import.meta as any).env.VITE_GEMINI_API_KEY || "") as string).trim() : "") as string;
  const geminiKey = geminiKeyEnv || (typeof localStorage !== "undefined" ? (localStorage.getItem("gemini_api_key") || "").trim() : "");
  const geminiModelEnv = (typeof import.meta !== "undefined" && (import.meta as any).env ? (((import.meta as any).env.VITE_GEMINI_MODEL || "") as string).trim() : "") as string;
  const geminiModelLS = typeof localStorage !== "undefined" ? (localStorage.getItem("gemini_model") || "").trim() : "";
  const geminiModel = geminiModelEnv || geminiModelLS || "gemini-2.5-pro";
  const aiLogUrl = (() => {
    try {
      const envAny: any = (typeof import.meta !== "undefined" && (import.meta as any).env) ? (import.meta as any).env : {} as any;
      const fromEnv = String(envAny.VITE_AI_LOG_URL || '').trim();
      const fromLs = typeof localStorage !== "undefined" ? (String(localStorage.getItem('ai_log_url') || '').trim()) : '';
      return fromEnv || fromLs || '';
    } catch { return ''; }
  })();
  const postAiLog = async (payload: any) => {
    if (!aiLogUrl) return;
    try { await apiService.post(aiLogUrl, payload); } catch {}
  };

  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [input, setInput] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as AiMessage[];
        if (Array.isArray(data)) setMessages(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getAiSubjectId = useCallback(async (prompt: string): Promise<number> => {
    try {
      const list = await subjectsService.getSubjects();
      if (list && list.length) return list[0].subjectId;
      const created = await subjectsService.createSubject({ name: "Chung", description: "Tạo tự động" } as any);
      return created.subjectId;
    } catch {
      return 0;
    }
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    const now = new Date();
    const userMsg: AiMessage = { id: Date.now(), role: "user", content, time: formatTime(now) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setProgressStep(1);
    try {
      let body = "";
      setProgressStep(2);
      const getAllGeminiModels = (): string[] => {
        const envObj: Record<string, string> = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {} as any;
        const modelsCsv = String(envObj.VITE_GEMINI_MODELS || '').trim();
        const modelsExtraKeys = Object.keys(envObj).filter(k => /^VITE_GEMINI_MODEL_\d+$/.test(k));
        const modelsExtra = modelsExtraKeys.map(k => String(envObj[k] || '').trim()).filter(Boolean);
        const lsCsv = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_models') || '') : '';
        const base = [geminiModel, modelsCsv, ...modelsExtra, lsCsv].join(',').split(',').map(s => s.trim()).filter(Boolean);
        const defaults = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
        return Array.from(new Set([...base, ...defaults])).filter(Boolean);
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
      const models = getAllGeminiModels();
      const keys = getAllGeminiKeys();
      let suggestion: { content: string } | null = null;
      for (const k of (keys.length ? keys : [''])) {
        for (const m of models) {
          try {
            const sid = await getAiSubjectId(content);
            const r = await questionsService.generateAIQuestionWithModel({ description: content, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 }, m, k);
            if (r && r.content) { suggestion = r; break; }
          } catch {}
        }
        if (suggestion) break;
      }
      if (!suggestion) {
        const sid = await getAiSubjectId(content);
        suggestion = await questionsService.generateAIQuestion({ description: content, subjectId: sid, questionType: 'MultipleChoice', difficulty: 'Medium', marks: 1 });
      }
      body = String(suggestion.content ?? '').trim() || 'Xin lỗi, chưa có phản hồi.';
      setProgressStep(3);
      const aiMsg: AiMessage = { id: Date.now() + 1, role: "ai", content: body, time: formatTime(new Date()) };
      setMessages(prev => [...prev, aiMsg]);
      try {
        const lang = (() => { try { const s = content; if (/[\u3040-\u30ff]/.test(s)) return "ja"; if (/[\u0600-\u06FF]/.test(s)) return "ar"; if (/[đáâăơưêôàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(s)) return "vi"; return "en"; } catch { return "en"; } })();
        await postAiLog({ prompt: content, response: body, language: lang, isError: false });
      } catch {}
    } catch {
      try {
        const sid = await getAiSubjectId(text ?? input);
        const res = await questionsService.generateAIQuestion({ description: text ?? input, subjectId: sid, questionType: "MultipleChoice", difficulty: "Medium", marks: 1 });
        const body = String(res.content ?? "").trim() || "Xin lỗi, chưa có phản hồi.";
        const aiMsg: AiMessage = { id: Date.now() + 1, role: "ai", content: body, time: formatTime(new Date()) };
        setMessages(prev => [...prev, aiMsg]);
        try { await postAiLog({ prompt: text ?? input, response: body, language: "en", isError: false }); } catch {}
      } catch {
        const aiMsg: AiMessage = { id: Date.now() + 1, role: "ai", content: "Xin lỗi, AI không thể phản hồi lúc này.", time: formatTime(new Date()) };
        setMessages(prev => [...prev, aiMsg]);
        try { await postAiLog({ prompt: text ?? input, response: "", language: "en", isError: true, errorMessage: "AI không thể phản hồi" }); } catch {}
      }
    }
    setSending(false);
    setTimeout(() => setProgressStep(0), 300);
  }, [input, sending, geminiKey, geminiModel, getAiSubjectId]);

  const clear = useCallback(() => {
    setMessages([]);
    setProgressStep(0);
    setSending(false);
    setInput("");
  }, []);

  const value = useMemo(() => ({ messages, sending, progressStep, input, setInput, send, clear }), [messages, sending, progressStep, input, send, clear]);

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat() {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    return {
      messages: [],
      sending: false,
      progressStep: 0,
      input: "",
      setInput: () => {},
      send: async () => {},
      clear: () => {},
    };
  }
  return ctx;
}
