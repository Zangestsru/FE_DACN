import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateToTime } from '@/utils/time';
import { chatService } from '@/services';
import type { ChatRoom, ChatMessage } from '@/types';
import { toast } from 'sonner';

const AdminChat: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const typingUsersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let unsubMsg: (() => void) | null = null;
    let unsubTyping: (() => void) | null = null;
    (async () => {
      try {
        await chatService.connect();
        await loadRooms();
        unsubMsg = chatService.onMessageReceived((msg) => {
          if (activeRoom && msg.roomId === activeRoom.roomId) {
            setMessages((prev) => {
              if (prev.some(m => m.messageId === msg.messageId)) return prev;
              return [...prev, msg];
            });
          } else {
            setUnreadMap((prev) => ({ ...prev, [msg.roomId]: (prev[msg.roomId] || 0) + 1 }));
            toast.info(`Tin nhắn mới từ phòng #${msg.roomId}`);
          }
        });
        unsubTyping = chatService.onUserTyping((data) => {
          if (activeRoom && data.roomId === activeRoom.roomId) {
            typingUsersRef.current.add(data.userId);
            setTimeout(() => {
              typingUsersRef.current.delete(data.userId);
            }, 3000);
          }
        });
      } catch (e) {
        console.error('SignalR connect error', e);
      }
    })();
    return () => {
      unsubMsg?.();
      unsubTyping?.();
    };
  }, []);

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const list = await chatService.getUserRooms();
      const normalized = Array.isArray(list) ? list : [];
      // Ưu tiên phòng hỗ trợ
      const sorted = normalized.sort((a, b) => (a.roomType === 'support' ? -1 : 0));
      setRooms(sorted);
      if (!activeRoom && sorted.length > 0) {
        await selectRoom(sorted[0]);
      }
    } catch (e) {
      console.error('Load rooms error', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const selectRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setUnreadMap((prev) => ({ ...prev, [room.roomId]: 0 }));
    setIsLoadingMessages(true);
    try {
      await chatService.joinChatRoom(room.roomId);
      const history = await chatService.getChatHistory(room.roomId, 1, 100);
      const raw = Array.isArray(history?.messages) ? history.messages : Array.isArray(history) ? history : [];
      const uniq: ChatMessage[] = [];
      const seen = new Set<number>();
      for (const m of raw) {
        if (typeof m.messageId === 'number' && !seen.has(m.messageId)) {
          seen.add(m.messageId);
          uniq.push(m);
        }
      }
      setMessages(uniq);
    } catch (e) {
      console.error('Select room error', e);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!activeRoom || !newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      await chatService.sendMessage(activeRoom.roomId, { content, messageType: 'text' });
      await chatService.stopTyping(activeRoom.roomId);
    } catch (e) {
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const onType = async (val: string) => {
    setNewMessage(val);
    if (!activeRoom) return;
    try {
      await chatService.startTyping(activeRoom.roomId);
    } catch {}
  };

  const roomTitle = (room: ChatRoom) => {
    if (room.roomType === 'support') return room.name || 'Hỗ trợ';
    if (room.roomType === 'private') return room.name || 'Trò chuyện riêng';
    if (room.roomType === 'course') return room.name || 'Phòng khóa học';
    if (room.roomType === 'exam') return room.name || 'Phòng kỳ thi';
    return room.name || `Phòng #${room.roomId}`;
  };

  return (
    <div className="container py-3">
      <h4 className="mb-3">Admin Chat</h4>
      <div className="row">
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold">Phòng chat</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadRooms} disabled={isLoadingRooms}>
                {isLoadingRooms ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {rooms.map((r) => (
                <button key={r.roomId} className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeRoom?.roomId === r.roomId ? 'active' : ''}`} onClick={() => selectRoom(r)}>
                  <div>
                    <div className="fw-semibold">{roomTitle(r)}</div>
                    <div className="small text-muted">{r.description || (r.roomType === 'support' ? 'Phòng hỗ trợ riêng giữa người dùng và admin' : r.roomType)}</div>
                  </div>
                  {unreadMap[r.roomId] > 0 && (
                    <span className="badge bg-danger rounded-pill">{unreadMap[r.roomId]}</span>
                  )}
                </button>
              ))}
              {rooms.length === 0 && (
                <div className="p-3 text-muted small">Không có phòng chat</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-md-8">
          <div className="card" style={{ minHeight: '60vh' }}>
            <div className="card-header">
              <div className="fw-semibold">{activeRoom ? roomTitle(activeRoom) : 'Chọn phòng để bắt đầu'}</div>
              {activeRoom && (
                <div className="small text-muted">{activeRoom.description || 'Phòng hỗ trợ riêng giữa người dùng và admin'}</div>
              )}
            </div>
            <div className="card-body d-flex flex-column" style={{ height: '50vh', overflow: 'auto' }}>
              {isLoadingMessages && <div className="text-center text-muted small">Đang tải tin nhắn...</div>}
              {!isLoadingMessages && messages.map((m) => {
                const mine = isOwnMessage(m);
                return (
                  <div key={m.messageId} className={`d-flex mb-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div 
                      className={`p-2 rounded-3 ${mine ? 'bg-primary text-white' : 'bg-light'}`}
                      style={{
                        maxWidth: '75%',
                        borderBottomRightRadius: mine ? 0 : undefined,
                        borderBottomLeftRadius: !mine && m.messageType !== 'system' ? 0 : undefined,
                      }}
                    >
                      {m.messageType !== 'system' && !mine && (
                        <div className="small fw-bold mb-1" style={{ fontSize: '11px' }}>{m.senderName || m.senderId}</div>
                      )}
                      <div style={{ fontSize: '14px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      <div className={`mt-1 ${mine ? 'text-white-50 text-end' : 'text-muted text-start'}`} style={{ fontSize: '11px' }}>
                        {formatDateToTime(new Date(m.sentAt))}
                        {m.isEdited && ' (đã chỉnh sửa)'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card-footer">
              <div className="input-group">
                <input type="text" className="form-control" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => onType(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} disabled={!activeRoom} />
                <button className="btn btn-primary" onClick={sendMessage} disabled={!activeRoom || !newMessage.trim()}>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
  const isOwnMessage = (m: ChatMessage): boolean => {
    if (m.messageType === 'system') return false;
    const userStr = localStorage.getItem('authUser') || localStorage.getItem('USER_INFO') || localStorage.getItem('user') || localStorage.getItem('USER');
    let uid: any = 0;
    let uname = '';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        uid = u.id || u.userId || u.UserId || 0;
        uname = (u.fullName || u.username || '').toString();
        if (typeof uid === 'string') uid = parseInt(uid, 10);
      } catch {}
    }
    let sid: any = m.senderId;
    if (typeof sid === 'string') {
      const n = parseInt(sid, 10);
      sid = Number.isNaN(n) ? sid : n;
    }
    if (typeof uid === 'number' && typeof sid === 'number' && uid && sid && uid === sid) return true;
    const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const sname = (m.senderName || '').toString();
    return !!uname && !!sname && strip(uname) === strip(sname);
  };
