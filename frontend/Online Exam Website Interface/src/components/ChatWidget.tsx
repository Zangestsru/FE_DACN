import React, { useState, useRef, useEffect } from 'react';
import { formatDateToTime } from '../utils/time';

interface ChatWidgetProps {
  isVisible: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date(Date.now() - 300000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const quickReplies = [
    'Tôi cần hỗ trợ về khóa học',
    'Làm sao để thanh toán?',
    'Chứng chỉ được cấp như thế nào?',
    'Tôi quên mật khẩu'
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages([...messages, userMessage]);
      setNewMessage('');

      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: getBotResponse(newMessage),
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const getBotResponse = (message: string) => {
    const msg = message.toLowerCase();
    
    if (msg.includes('khóa học') || msg.includes('course')) {
      return 'Bạn có thể xem tất cả khóa học tại trang "Tài liệu ôn tập". Nếu cần hỗ trợ cụ thể, vui lòng cho biết khóa học nào bạn quan tâm.';
    } else if (msg.includes('thanh toán') || msg.includes('payment')) {
      return 'Chúng tôi hỗ trợ thanh toán qua MoMo và các phương thức khác. Bạn sẽ thấy tùy chọn thanh toán khi đăng ký khóa học.';
    } else if (msg.includes('chứng chỉ') || msg.includes('certificate')) {
      return 'Chứng chỉ sẽ được cấp sau khi bạn hoàn thành 100% khóa học và đạt điểm tối thiểu trong bài kiểm tra cuối khóa.';
    } else if (msg.includes('mật khẩu') || msg.includes('password')) {
      return 'Bạn có thể reset mật khẩu tại trang đăng nhập bằng cách click "Quên mật khẩu?" và làm theo hướng dẫn.';
    } else {
      return 'Cảm ơn bạn đã liên hệ! Tôi sẽ chuyển câu hỏi của bạn đến đội ngũ hỗ trợ. Họ sẽ phản hồi trong vòng 24h.';
    }
  };

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply);
  };

  // Remove local formatTime function - using utility instead

  if (!isVisible) return null;

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
          
          {/* Notification Badge */}
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
            1
          </div>
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
              onClick={() => setIsOpen(false)}
              style={{ fontSize: '18px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow-1 p-3 overflow-auto" style={{ maxHeight: '350px' }}>
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`mb-3 d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div 
                  className={`p-2 rounded-3 max-w-75 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-light'
                  }`}
                  style={{ maxWidth: '75%' }}
                >
                  <div style={{ fontSize: '14px' }}>{message.text}</div>
                  <div 
                    className={`mt-1 ${message.sender === 'user' ? 'text-white-50' : 'text-muted'}`}
                    style={{ fontSize: '11px' }}
                  >
                    {formatDateToTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
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
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                style={{ fontSize: '14px' }}
              />
              <button 
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};