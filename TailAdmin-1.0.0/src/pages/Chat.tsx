import { useEffect, useMemo, useRef, useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { UserCircleIcon } from "../icons";
import { adminChatService, ChatRoom, ChatMessage } from "../services/chat.service";

export default function Chat() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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
    loadRooms();
    
    // Try to connect to SignalR (non-blocking)
    adminChatService.connect().catch(err => {
      console.warn('SignalR connection failed, will use REST API only');
    });

    // Subscribe to new messages
    const unsubscribe = adminChatService.onMessageReceived((message) => {
      setMessages(prev => {
        // Only add if not already in list
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
  }, []);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      loadChatHistory(activeRoomId);
    }
  }, [activeRoomId]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ 
      top: listRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  }, [messages.length]);

  /**
   * Load all chat rooms
   */
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const response = await adminChatService.getAllRooms(1, 100);
      if (response.success) {
        const supportRooms = response.data.filter(r => r.roomType === 'support');
        setRooms(supportRooms);
        
        // Auto select first room
        if (supportRooms.length > 0 && !activeRoomId) {
          setActiveRoomId(supportRooms[0].roomId);
        }
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
    setIsLoading(false);
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
      await adminChatService.sendMessage(activeRoomId, messageContent);
      // Message will be added via SignalR callback
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setInput(messageContent); // Restore message
    }
    setIsSending(false);
  };

  /**
   * Check if message is from admin
   */
  const isAdminMessage = (message: ChatMessage): boolean => {
    const adminUser = localStorage.getItem('user');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      return message.senderId === user.userId;
    }
    return false;
  };

  /**
   * Format time
   */
  const formatTime = (date: Date | string): string => {
    const d = new Date(date);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  /**
   * Get display name for sender
   */
  const getSenderDisplayName = (message: ChatMessage): string => {
    if (isAdminMessage(message)) return 'Bạn';
    return message.senderName || 'User';
  };

  return (
    <>
      <PageMeta title="Quản lý tin nhắn hỗ trợ" />
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
                          {room.name}
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
                        {activeRoom.name}
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
                          className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${fromMe ? 'order-1' : 'order-2'}`}>
                            {!fromMe && (
                              <p className="text-xs text-gray-500 mb-1 px-1">
                                {getSenderDisplayName(msg)}
                              </p>
                            )}
                            <div
                              className={`
                                rounded-2xl px-4 py-2
                                ${fromMe 
                                  ? 'bg-brand-600 text-white rounded-br-none' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                                }
                              `}
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
