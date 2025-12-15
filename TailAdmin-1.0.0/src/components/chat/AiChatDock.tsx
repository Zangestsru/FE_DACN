import { useEffect, useMemo, useRef, useState } from "react";
import { useAiChat } from "../../context/AiChatContext";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function AiChatDock() {
  const { messages, input, setInput, send, sending, progressStep, clear } = useAiChat();
  const [open, setOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const envAny: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
  const initialModel = (String(envAny.VITE_GEMINI_MODEL || '').trim() || (typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '') || 'gemini-2.5-pro');
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  const steps = useMemo(() => ([
    { id: 1, text: "Đang phân tích câu hỏi" },
    { id: 2, text: "Đang tìm kiếm thông tin" },
    { id: 3, text: "Đang tổng hợp câu trả lời" }
  ]), []);

  const allModels = useMemo(() => {
    const envObj: Record<string, string> = envAny || {} as any;
    const modelsCsv = String(envObj.VITE_GEMINI_MODELS || '').trim();
    const modelsExtraKeys = Object.keys(envObj).filter(k => /^VITE_GEMINI_MODEL_\d+$/.test(k));
    const modelsExtra = modelsExtraKeys.map(k => String(envObj[k] || '').trim()).filter(Boolean);
    const lsCsv = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_models') || '') : '';
    const base = [selectedModel, modelsCsv, ...modelsExtra, lsCsv].join(',').split(',').map(s => s.trim()).filter(Boolean);
    const defaults = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
    return Array.from(new Set([...base, ...defaults])).filter(Boolean);
  }, [envAny, selectedModel]);

  const saveModel = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gemini_model', selectedModel);
        const current = String(localStorage.getItem('gemini_models') || '').trim();
        const set = Array.from(new Set([current, selectedModel].join(',').split(',').map(s => s.trim()).filter(Boolean)));
        localStorage.setItem('gemini_models', set.join(','));
      }
    } catch {}
    setModelOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-full bg-brand-600 text-white shadow-theme-lg w-12 h-12 flex items-center justify-center hover:bg-brand-500 focus:outline-none">
          <span className="sr-only">AI</span>
          <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" fill="currentColor"></path>
          </svg>
        </button>
      ) : (
        <div className="w-[360px] max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <div className="font-medium text-gray-800 dark:text-white">AI Chat</div>
            <div className="flex items-center gap-2">
              <button onClick={clear} className="text-xs text-gray-500 hover:text-red-600">Xóa</button>
              <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Đóng</button>
            </div>
          </div>
          {sending && (
            <div className="px-3 py-2">
              <div className="flex items-center justify-center">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {steps.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 ${progressStep >= s.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${progressStep === s.id ? 'bg-brand-500 animate-pulse' : (progressStep > s.id ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600')}`}></span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div ref={listRef} className="px-3 py-2 h-64 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-3 opacity-30">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" fill="currentColor"></path>
                  </svg>
                  <p className="text-sm">Bắt đầu trò chuyện với AI</p>
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto text-right' : ''}`}>
                  <div className={`${m.role === 'user' ? 'bg-brand-600 text-white rounded-2xl rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-none'} px-4 py-2`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>{m.time}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 p-2">
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Nhập câu hỏi..." className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700" />
              <Button variant="outline" size="sm" onClick={() => setModelOpen(true)} className="px-3 py-2.5">Model</Button>
              <Button onClick={() => send()} disabled={sending || !input.trim()} className="px-4 py-2.5 min-w-[80px]">Gửi</Button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Model đang dùng:</span>
              <button onClick={() => setModelOpen(true)} className="inline-flex items-center rounded-full px-2 py-1 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-white/[0.03]">
                {selectedModel}
              </button>
            </div>
          </div>
          <Modal isOpen={modelOpen} onClose={() => setModelOpen(false)}>
            <div className="p-4 w-[360px]">
              <div className="mb-3">
                <div className="font-medium">Chọn model AI</div>
                <div className="text-xs text-gray-500">Model sẽ dùng để tạo câu hỏi</div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allModels.map(m => (
                  <label key={m} className={`flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-inset ${selectedModel === m ? 'ring-brand-500 bg-brand-50 dark:bg-white/[0.03]' : 'ring-gray-200 dark:ring-gray-800'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="ai-model" value={m} checked={selectedModel === m} onChange={() => setSelectedModel(m)} className="rounded" />
                      <span className="text-sm">{m}</span>
                    </div>
                    {selectedModel === m && <span className="text-xs text-brand-600">Đang chọn</span>}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setModelOpen(false)}>Đóng</Button>
                <Button size="sm" onClick={saveModel}>Lưu</Button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
