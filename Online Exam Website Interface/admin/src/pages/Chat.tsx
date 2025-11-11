import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { UserCircleIcon } from "../icons";

type ChatUser = {
  id: string;
  name: string;
  lastMessage?: string;
};

type Message = {
  id: string;
  userId: string; // partner id
  fromMe: boolean;
  text: string;
  time: string; // HH:mm
};

export default function Chat() {
  const initialUsers = useMemo<ChatUser[]>(
    () => [
      { id: "u1", name: "Nguyễn Văn A", lastMessage: "Chào bạn" },
      { id: "u2", name: "Trần Thị B", lastMessage: "Hẹn gặp 2h" },
      { id: "u3", name: "Lê Văn C", lastMessage: "OK nhé" },
    ],
    []
  );

  const [userList, setUserList] = useState<ChatUser[]>(initialUsers);
  const location = useLocation();
  // Nếu có ?name=... từ trang Users/Teachers, tự chọn (và thêm vào list nếu chưa có)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const name = params.get("name");
    if (name) {
      let target = userList.find((u) => u.name === name);
      if (!target) {
        target = { id: crypto.randomUUID(), name };
        setUserList((prev) => [...prev, target!]);
      }
      setActiveUserId(target.id);
    }
  }, [location.search]);

  const [query, setQuery] = useState("");
  const users = useMemo(
    () => userList.filter((u) => u.name.toLowerCase().includes(query.toLowerCase())),
    [userList, query]
  );

  const [activeUserId, setActiveUserId] = useState<string | null>(users[0]?.id || null);
  useEffect(() => {
    if (!activeUserId && users.length > 0) setActiveUserId(users[0].id);
  }, [users, activeUserId]);

  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", userId: "u1", fromMe: false, text: "Chào bạn", time: "09:00" },
    { id: "m2", userId: "u1", fromMe: true, text: "Hi!", time: "09:01" },
  ]);

  const activeMessages = useMemo(
    () => messages.filter((m) => m.userId === activeUserId),
    [messages, activeUserId]
  );

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length]);

  const sendMessage = () => {
    if (!input.trim() || !activeUserId) return;
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), userId: activeUserId, fromMe: true, text: input.trim(), time: `${hh}:${mm}` },
    ]);
    setInput("");
  };

  return (
    <>
      <PageMeta title="Chat" />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Chat</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Danh sách người dùng */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <input
                placeholder="Tìm người dùng"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveUserId(u.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    activeUserId === u.id ? "bg-gray-50 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <UserCircleIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u.name}</div>
                    {u.lastMessage && (
                      <div className="text-xs text-gray-500 truncate">{u.lastMessage}</div>
                    )}
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">Không tìm thấy người dùng</div>
              )}
            </div>
          </aside>

          {/* Khung chat */}
          <section className="lg:col-span-8 xl:col-span-9 rounded-xl ring-1 ring-gray-200 dark:ring-gray-800 flex flex-col min-h-[60vh]">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div className="font-medium">
                {userList.find((u) => u.id === activeUserId)?.name || "Chọn người dùng"}
              </div>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {activeUserId ? (
                activeMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`${
                      m.fromMe
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                    } rounded-2xl px-4 py-2 max-w-[70%]`}> 
                      <div className="text-sm whitespace-pre-wrap break-words">{m.text}</div>
                      <div className="mt-1 text-[10px] opacity-70 text-right">{m.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">Chọn một người dùng để bắt đầu trò chuyện.</div>
              )}
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
              <Button onClick={sendMessage}>Gửi</Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

