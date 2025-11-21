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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [isOpen]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribeMessage = chatService.onMessageReceived((message) => {
      if (message.roomId === currentRoom.roomId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    const unsubscribeTyping = chatService.onUserTyping((data) => {
      if (data.roomId === currentRoom.roomId) {
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

  /**
   * Initialize chat: get or create support room and load history
   */
  const initializeChat = async () => {
    try {
      setIsConnecting(true);
      
      // Get or create support room
      const room = await chatService.getOrCreateSupportRoom();
      setCurrentRoom(room);

      // Load chat history
      const history = await chatService.getChatHistory(room.roomId, 1, 50);
      
      // Debug: Log history structure
      console.log('📜 Chat history:', history);
      
      // Safely extract messages
      if (history && Array.isArray(history.messages)) {
        setMessages(history.messages);
      } else if (Array.isArray(history)) {
        // Sometimes backend returns array directly
        setMessages(history);
      } else {
        console.warn('⚠️ Invalid history structure, using empty array');
        setMessages([]);
      }
      
      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setIsConnecting(false);
      
      // Fallback to welcome message if error
      setMessages([{
        messageId: 0,
        roomId: 0,
        senderId: 0,
        senderName: 'Hệ thống',
        content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
        messageType: 'system',
        sentAt: new Date().toISOString(),
        isEdited: false
      }]);
    }
  };

  /**
   * Handle sending message
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || isLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      // Send message via API
      await chatService.sendMessage(currentRoom.roomId, {
        content: messageContent,
        messageType: 'text'
      });

      // Stop typing indicator
      await chatService.stopTyping(currentRoom.roomId);
      
      setIsLoading(false);
      
      // Message will be added via SignalR callback
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        messageId: Date.now(),
        roomId: currentRoom.roomId,
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
    const currentUser = getCurrentUser();
    
    // Try multiple user ID fields
    let userId = currentUser?.userId || currentUser?.id || currentUser?.UserId;
    
    // Convert to number if it's a string
    if (typeof userId === 'string') {
      userId = parseInt(userId, 10);
    }
    
    // Compare (both should be numbers now)
    const isOwn = message.senderId === userId;
    
    return isOwn;
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
              height: '400px',
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

            <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center p-4 text-center">
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
              <span className="fw-bold">Hỗ trợ trực tuyến</span>
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
                      className={`p-2 rounded-3 max-w-75 ${
                        isOwnMessage(message)
                          ? 'bg-primary text-white' 
                          : message.messageType === 'system'
                          ? 'bg-warning bg-opacity-10 text-dark'
                          : 'bg-light'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      {!isOwnMessage(message) && message.messageType !== 'system' && (
                        <div className="small fw-bold mb-1" style={{ fontSize: '11px' }}>
                          {getSenderName(message)}
                        </div>
                      )}
                      <div style={{ fontSize: '14px' }}>{message.content}</div>
                      <div 
                        className={`mt-1 ${
                          isOwnMessage(message) ? 'text-white-50' : 'text-muted'
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
                onKeyPress={(e) => {
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
