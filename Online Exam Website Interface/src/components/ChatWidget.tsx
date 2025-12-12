import React, { useState, useRef, useEffect } from 'react';
import { formatDateToTime } from '../utils/time';
import { chatService } from '../services';
import type { ChatMessage, ChatRoom } from '../types';
import { STORAGE_KEYS } from '../constants';

interface ChatWidgetProps {
  isVisible: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const quickReplies = [
    'Tôi cần hỗ trợ về khóa học',
    'Làm sao để thanh toán?',
    'Chứng chỉ được cấp như thế nào?',
    'Tôi quên mật khẩu'
  ];
 
  
  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  };

  // Initialize chat when widget opens
  useEffect(() => {
    if (isOpen && isLoggedIn() && !currentRoom) {
      initializeChat();
    }
    // Save open state
    localStorage.setItem('chat_widget_open', isOpen ? 'true' : 'false');
  }, [isOpen, targetUserId, currentRoom]); // Re-run if targetUserId changes or currentRoom is nullified

  // Listen for external open events and restore state
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      setIsOpen(true);
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.targetUserId) {
          setTargetUserId(customEvent.detail.targetUserId);
          // Clear current room to force re-initialization with new target
          setCurrentRoom(null); 
        } else {
          // If no target user ID, reset to null (support mode)
          setTargetUserId(null);
        }
        
        if (customEvent.detail.initialMessage) {
          setNewMessage(customEvent.detail.initialMessage);
        }
      } else {
        // No detail provided, default to support
        setTargetUserId(null);
      }
    };
    
    window.addEventListener('open-chat-widget', handleOpenChat);
    
    // Restore state
    const wasOpen = localStorage.getItem('chat_widget_open') === 'true';
    if (wasOpen) setIsOpen(true);
  
    return () => {
      window.removeEventListener('open-chat-widget', handleOpenChat);
    };
  }, []);
  
    // Subscribe to real-time messages
    useEffect(() => {
      // Connect to SignalR regardless of open state to receive notifications
      // BUT only if user is logged in
      if (isLoggedIn()) {
        chatService.connect().catch(console.error);
      }
  
      const unsubscribeMessage = chatService.onMessageReceived((message) => {
        // If current room is open and matches, add message
        if (currentRoom && message.roomId === currentRoom.roomId) {
          setMessages(prev => {
            if (prev.some(m => m.messageId === message.messageId)) return prev;
            const newMessages = [...prev, message];
            
            // Sync with localStorage
            localStorage.setItem(`chat_messages_${currentRoom.roomId}`, JSON.stringify(newMessages));
            
            return newMessages;
          });
          scrollToBottom();
        } else {
            // If chat is closed or different room, trigger notification (if not from self)
             if (!isOwnMessage(message)) {
                // If it's a support room message (which this widget handles), you might want to auto-open or just notify
                // For now, we rely on the Header component to show the red dot.
                // But we should also ensure we join the support room if we haven't
             }
        }
      });
  
      const unsubscribeTyping = chatService.onUserTyping((data) => {
        if (currentRoom && data.roomId === currentRoom.roomId) {
          setTypingUsers(prev => new Set(prev).add(data.userId));
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }, 3000);
        }
      });
  
      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
      };
    }, [currentRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatRoomName = (name?: string): string => {
    const s = (name || '').trim();
    if (!s) return '';
    const m = s.match(/^(?:Hỗ trợ trực tuyến|Ho tro truc tuyen|Support room|Support|Hỗ trợ)\s*[-–—:\|]?\s*(.*)$/i);
    if (m && m[1]) return m[1].trim();
    return s;
  };

  /**
   * Initialize chat: get or create support room and load history
   */
  const initializeChat = async () => {
    try {
      setIsConnecting(true);
      
      let room: ChatRoom;
      
      // If targetUserId is set, create private room with that user
      if (targetUserId) {
        room = await chatService.getOrCreatePrivateRoom(targetUserId);
      } else {
        // Otherwise, use general support room
        room = await chatService.getOrCreateSupportRoom();
      }
      
      setCurrentRoom(room);

      // Try load from cache first
      const cached = localStorage.getItem(`chat_messages_${room.roomId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Error parsing cached messages in widget', e);
        }
      }

      // Load chat history from server
      const history = await chatService.getChatHistory(room.roomId, 1, 50);
      
      // Debug: Log history structure
      console.log('📜 Chat history:', history);
      
      // Safely extract messages and deduplicate by messageId
      let rawMsgs: any[] = [];
      if (history) {
        if (Array.isArray(history.messages)) {
          rawMsgs = history.messages;
        } else if (Array.isArray((history as any).Messages)) {
          rawMsgs = (history as any).Messages;
        } else if (Array.isArray(history)) {
          rawMsgs = history;
        }
      }

      const uniq = [] as any[];
      const seen = new Set<number>();
      for (const m of rawMsgs) {
        const id = (m && typeof m.messageId === 'number') ? m.messageId : -1;
        if (id !== -1 && !seen.has(id)) {
          seen.add(id);
          uniq.push(m);
        }
      }
      
      // Merge with cache if needed, or just set
      // Actually, server history is authoritative, but cache might have pending/recent ones?
      // For simplicity, let's trust server history as ground truth, but use cache for instant load
      // We will update cache with server data
      setMessages(uniq);
      localStorage.setItem(`chat_messages_${room.roomId}`, JSON.stringify(uniq));
      
      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsConnecting(false);
      
      // Only fallback to welcome if we have NO messages (cache also empty)
      if (messages.length === 0) {
        // Removed welcome message as per user request to avoid auto-generated messages
        // setMessages([welcomeMsg]);
      }
    }
  };

  /**
   * Handle sending message
   */
  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || isLoading) return;

    setIsLoading(true);
    try {
      let room = currentRoom;
      if (!room) {
        if (targetUserId) {
          room = await chatService.getOrCreatePrivateRoom(targetUserId);
        } else {
          room = await chatService.getOrCreateSupportRoom();
        }
        setCurrentRoom(room);
      }

      const sent = await chatService.sendMessage(room.roomId, {
        content,
        messageType: 'text'
      });

      setNewMessage('');
      await chatService.stopTyping(room.roomId);
      setIsLoading(false);
      
      // Note: chatService now broadcasts the sent message to all listeners
      // so we don't need to manually add it here. The onMessageReceived callback will handle it.
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        messageId: Date.now(),
        roomId: currentRoom?.roomId || 0,
        senderId: 0,
        senderName: 'Hệ thống',
        content: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
        messageType: 'system',
        sentAt: new Date().toISOString(),
        isEdited: false
      }]);
    }
  };

  /**
   * Handle quick reply click
   */
  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
  };

  /**
   * Handle typing event
   */
  const handleTyping = async () => {
    if (!currentRoom) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send start typing
    await chatService.startTyping(currentRoom.roomId);

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      await chatService.stopTyping(currentRoom.roomId);
    }, 2000);
  };

  /**
   * Get sender display name
   */
  const getSenderName = (message: ChatMessage): string => {
    if (message.messageType === 'system') return 'Hệ thống';
    
    const currentUser = getCurrentUser();
    if (message.senderId === currentUser?.userId) return 'Bạn';
    
    return message.senderName || 'Admin';
  };

  /**
   * Get current user from storage
   */
  const getCurrentUser = () => {
    // Try USER_INFO first (correct key)
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO) || 
                    localStorage.getItem('user') ||
                    localStorage.getItem('USER');
    
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  };

  /**
   * Check if message is from current user
   */
  const isOwnMessage = (message: ChatMessage): boolean => {
    if (message.messageType === 'system') return false;
    const currentUser = getCurrentUser();
    let userId: any = currentUser?.userId || currentUser?.id || currentUser?.UserId;
    if (typeof userId === 'string') userId = parseInt(userId, 10);
    if (typeof userId !== 'number' || Number.isNaN(userId)) return false;
    // Dựa trên ID để phân biệt trái/phải, không phụ thuộc vào tên hiển thị
    return message.senderId === userId;
  };

  /**
   * Handle widget close
   */
  const handleClose = async () => {
    setIsOpen(false);
    
    // Leave room when closing
    if (currentRoom) {
      await chatService.leaveRoom(currentRoom.roomId);
    }
  };

  if (!isVisible) return null;

  // Show login prompt if not logged in
  if (!isLoggedIn()) {
    return (
      <>
        {!isOpen && (
          <div 
            className="position-fixed rounded-circle d-flex align-items-center justify-content-center shadow-lg"
            style={{
              bottom: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              backgroundColor: '#007bff',
              cursor: 'pointer',
              zIndex: 1000,
              transition: 'all 0.3s ease'
            }}
            onClick={() => setIsOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = '#0056b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#007bff';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"/>
              <path d="M7 9H17V11H7V9Z"/>
              <path d="M7 12H15V14H7V12Z"/>
            </svg>
          </div>
        )}

        {isOpen && (
          <div 
            className="position-fixed bg-white rounded-3 shadow-lg d-flex flex-column"
            style={{
              bottom: '20px',
              right: '20px',
              width: '350px',
              height: '500px',
              zIndex: 1001,
              border: '1px solid #e9ecef'
            }}
          >
            <div className="bg-primary text-white p-3 rounded-top d-flex align-items-center justify-content-between">
              <span className="fw-bold">Hỗ trợ trực tuyến</span>
              <button 
                className="btn btn-sm text-white"
                onClick={() => setIsOpen(false)}
                style={{ fontSize: '18px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div className="grow d-flex flex-column align-items-center justify-content-center p-4 text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#6c757d" className="mb-3">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.93 6 15.5 7.57 15.5 9.5C15.5 11.43 13.93 13 12 13C10.07 13 8.5 11.43 8.5 9.5C8.5 7.57 10.07 6 12 6ZM12 20C9.97 20 8.08 19.23 6.67 17.97C8.07 16.46 10.13 15.5 12.5 15.5C14.87 15.5 16.93 16.46 18.33 17.97C16.92 19.23 15.03 20 12 20Z"/>
              </svg>
              <h5 className="mb-2">Vui lòng đăng nhập</h5>
              <p className="text-muted small">
                Bạn cần đăng nhập để sử dụng tính năng hỗ trợ trực tuyến
              </p>
              <a href="/login" className="btn btn-primary btn-sm mt-2">
                Đăng nhập ngay
              </a>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <div 
          className="position-fixed rounded-circle d-flex align-items-center justify-content-center shadow-lg"
          style={{
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            backgroundColor: '#007bff',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
          onClick={() => setIsOpen(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#0056b3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#007bff';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"/>
            <path d="M7 9H17V11H7V9Z"/>
            <path d="M7 12H15V14H7V12Z"/>
          </svg>
          
          {/* Notification Badge - Only show if unread */}
          {messages.length > 0 && (
            <div 
              className="position-absolute rounded-circle bg-danger d-flex align-items-center justify-content-center"
              style={{
                top: '-5px',
                right: '-5px',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                color: 'white'
              }}
            >
              •
            </div>
          )}
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="position-fixed bg-white rounded-3 shadow-lg d-flex flex-column"
          style={{
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            zIndex: 1001,
            border: '1px solid #e9ecef'
          }}
        >
          {/* Header */}
            <div className="bg-primary text-white p-3 rounded-top d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle bg-success me-2"
                  style={{ width: '10px', height: '10px' }}
                ></div>
                <div>
                  <div className="fw-bold">
                    {targetUserId ? (currentRoom?.name || 'Chat với giảng viên') : 'Hỗ trợ trực tuyến'}
                  </div>
                  <div className="small" style={{ opacity: 0.85 }}>
                    {currentRoom?.description || 'Phòng hỗ trợ riêng giữa người dùng và admin'}
                  </div>
                </div>
              </div>
            <button 
              className="btn btn-sm text-white"
              onClick={handleClose}
              style={{ fontSize: '18px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow-1 p-3 overflow-auto" style={{ maxHeight: '350px' }}>
            {isConnecting ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Đang kết nối...</span>
                </div>
                <div className="small text-muted mt-2">Đang kết nối...</div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div 
                    key={message.messageId}
                    className={`mb-3 d-flex ${
                      isOwnMessage(message) ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div 
                      className={`p-2 rounded-3 ${
                        isOwnMessage(message)
                          ? 'bg-primary text-white'
                          : message.messageType === 'system'
                          ? 'bg-warning bg-opacity-10 text-dark'
                          : 'bg-light'
                      }`}
                      style={{ 
                        maxWidth: '75%',
                        borderBottomRightRadius: isOwnMessage(message) ? 0 : undefined,
                        borderBottomLeftRadius: !isOwnMessage(message) && message.messageType !== 'system' ? 0 : undefined,
                      }}
                    >
                      {!isOwnMessage(message) && message.messageType !== 'system' && (
                        <div className="small fw-bold mb-1" style={{ fontSize: '11px' }}>
                          {getSenderName(message)}
                        </div>
                      )}
                      <div style={{ fontSize: '14px' }}>{message.content}</div>
                      <div 
                        className={`mt-1 ${
                          isOwnMessage(message) ? 'text-white-50 text-end' : 'text-muted text-start'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {formatDateToTime(new Date(message.sentAt))}
                        {message.isEdited && ' (đã chỉnh sửa)'}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="mb-3 d-flex justify-content-start">
                    <div className="bg-light p-2 rounded-3">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && !isConnecting && (
            <div className="px-3 pb-2">
              <div className="small text-muted mb-2">Câu hỏi thường gặp:</div>
              <div className="d-flex flex-wrap gap-1">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    className="btn btn-outline-primary btn-sm"
                    style={{ fontSize: '11px' }}
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-top">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading || isConnecting}
                style={{ fontSize: '14px' }}
              />
              <button 
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading || isConnecting}
              >
                {isLoading ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Đang gửi...</span>
                  </div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typing Indicator CSS */}
      <style>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6c757d;
          animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }
      `}</style>
      
    </>
  );
};
