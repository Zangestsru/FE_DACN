import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatService, userService } from '@/services';
import { formatDateToTime } from '@/utils/time';
import type { ChatRoom, ChatMessage, IUser } from '@/types';
import { toast } from 'sonner';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography, 
  TextField, 
  IconButton, 
  Button,
  Badge,
  Divider,
  CircularProgress
} from '@mui/material';

// Fallback icons if @mui/icons-material not available
import { BiSend, BiSearch, BiSupport, BiArrowBack } from 'react-icons/bi';

const ChatPage: React.FC = () => {
  const { targetUserId, roomId } = useParams<{ targetUserId: string; roomId: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<IUser[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isSupportActive, setIsSupportActive] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  
  // Mobile responsive state
  const [showMobileList, setShowMobileList] = useState(true);
  
  // Refs for scrolling and typing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadMyRooms();
    
    // Connect SignalR
    chatService.connect().catch(err => console.error('Chat connect error', err));

    return () => {
      // Cleanup subscriptions if needed
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      if (roomId) {
        const rId = parseInt(roomId, 10);
        if (!isNaN(rId)) {
          await initializeRoomChat(rId);
        }
      } else if (targetUserId) {
        if (targetUserId === 'support') {
          await initializeSupportChat();
        } else {
          const targetId = parseInt(targetUserId, 10);
          if (!isNaN(targetId)) {
            await initializeChat(targetId);
          }
        }
      } else {
        // Default to support chat if no user selected
        // Only if we are at root /chat to avoid loop
        if (!window.location.pathname.includes('/chat/room/')) {
           navigate('/chat/support', { replace: true });
        }
      }
    };
    init();
  }, [targetUserId, roomId]);

  useEffect(() => {
    if (activeRoom) {
      // Ensure we join the SignalR group for real-time updates
      chatService.joinRoom(activeRoom.roomId).catch(console.error);
      // On mobile, hide list when room is active
      setShowMobileList(false);
    } else {
      setShowMobileList(true);
    }
  }, [activeRoom]);

  // Handle auto-scroll logic
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const isMine = isOwnMessage(lastMsg);
    
    // Scroll to bottom if:
    // 1. It's my own message
    // 2. Or I was already at the bottom
    if (isMine || isAtBottomRef.current) {
        scrollToBottom();
    }
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    console.log('🎧 ChatPage listening for messages. ActiveRoom:', activeRoom?.roomId);
    
    const unsub = chatService.onMessageReceived((msg) => {
      console.log('📥 ChatPage received message:', msg);
      
      // Update if it belongs to current room
      if (activeRoom && msg.roomId === activeRoom.roomId) {
        setMessages(prev => {
          // Check for duplicates
          if (prev.some(m => m.messageId === msg.messageId)) return prev;
          
          const newMessages = [...prev, msg];
          
          // Save to local storage for persistence
          localStorage.setItem(`chat_messages_${activeRoom.roomId}`, JSON.stringify(newMessages));
          
          return newMessages;
        });
        
        // Scroll logic is handled in the effect dependent on messages
      } else {
        // Notification for other rooms
        if (!isOwnMessage(msg)) {
          toast.info(`Tin nhắn mới từ ${msg.senderName}`);
        }
        // Refresh room list to show unread/latest
        loadMyRooms();
      }
    });
    return unsub;
  }, [activeRoom]);

  // Also listen to global window event for extra safety (sync with Widget)
  useEffect(() => {
    const handleGlobalMsg = (e: CustomEvent<ChatMessage>) => {
      const msg = e.detail;
      if (activeRoom && msg.roomId === activeRoom.roomId) {
        setMessages(prev => {
           if (prev.some(m => m.messageId === msg.messageId)) return prev;
           return [...prev, msg];
        });
      }
    };
    
    window.addEventListener('chat-message-received', handleGlobalMsg as EventListener);
    return () => window.removeEventListener('chat-message-received', handleGlobalMsg as EventListener);
  }, [activeRoom]);

  const onScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Consider "at bottom" if within 50px of the bottom
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  const loadCurrentUser = async () => {

    const user = await userService.getUserProfile();
    setCurrentUser(user);
  };

  const loadMyRooms = async () => {
    try {
      const myRooms = await chatService.getUserRooms();
      setRooms(myRooms);
      // Join all rooms to receive notifications
      myRooms.forEach(room => {
        chatService.joinRoom(room.roomId).catch(e => console.error(`Failed to join room ${room.roomId}`, e));
      });
    } catch (e) {
      console.error('Load rooms error', e);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await userService.getUsers(); 
      // Filter out current user
      const current = await userService.getUserProfile();
      const filtered = list.filter(u => u.id !== current?.id);
      setUsers(filtered);
    } catch (e) {
      console.error('Load users error', e);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const initializeRoomChat = async (roomId: number) => {
    isAtBottomRef.current = true;
    setIsLoadingMessages(true);
    try {
        // Fetch room details and history
        const history = await chatService.getChatHistory(roomId, 1, 100);
        if (history && history.room) {
            setActiveRoom(history.room);
            setIsSupportActive(history.room.roomType === 'support');
            
            // Process messages
            let msgs: any[] = [];
            if (Array.isArray(history.messages)) {
                msgs = history.messages;
            } else if (Array.isArray((history as any).Messages)) {
                msgs = (history as any).Messages;
            } else if (Array.isArray(history)) {
                msgs = history;
            }
            
            // Deduplicate and sort
            const uniqueMsgs = msgs.filter((m, index, self) => 
                index === self.findIndex((t) => t.messageId === m.messageId)
            );
            uniqueMsgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            
            setMessages(uniqueMsgs);
            // Update cache
            localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(uniqueMsgs));
            
            // Join room
            chatService.joinRoom(roomId).catch(console.error);
        } else {
            toast.error('Không tìm thấy phòng chat');
            navigate('/chat');
        }
    } catch (e) {
        console.error('Init room chat error', e);
        toast.error('Không thể kết nối phòng chat');
    } finally {
        setIsLoadingMessages(false);
    }
  };

  const initializeChat = async (targetId: number) => {
    isAtBottomRef.current = true;
    setIsLoadingMessages(true);
    setIsSupportActive(false);
    try {
      const room = await chatService.getOrCreatePrivateRoom(targetId);
      setActiveRoom(room);
      await loadMessages(room.roomId);
      // Ensure we join the room immediately after getting it
      chatService.joinRoom(room.roomId).catch(console.error);
    } catch (e) {
      console.error('Init chat error', e);
      toast.error('Không thể kết nối cuộc trò chuyện');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const initializeSupportChat = async () => {
    isAtBottomRef.current = true;
    setIsLoadingMessages(true);
    setIsSupportActive(true);
    try {
      const room = await chatService.getOrCreateSupportRoom();
      setActiveRoom(room);
      await loadMessages(room.roomId);
      // Ensure we join the room immediately after getting it
      chatService.joinRoom(room.roomId).catch(console.error);
    } catch (e) {
      console.error('Init support chat error', e);
      toast.error('Không thể kết nối phòng hỗ trợ');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMessages = async (roomId: number) => {
    try {
      // Try to load from local storage first for immediate display
      const cached = localStorage.getItem(`chat_messages_${roomId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Error parsing cached messages', e);
        }
      }

      const history = await chatService.getChatHistory(roomId, 1, 100);
      console.log('📜 Chat history loaded:', history);
      let msgs: any[] = [];
      if (history) {
        if (Array.isArray(history.messages)) {
          msgs = history.messages;
        } else if (Array.isArray((history as any).Messages)) {
          msgs = (history as any).Messages;
        } else if (Array.isArray(history)) {
          msgs = history;
        }
      }
      
      // Deduplicate
      const uniqueMsgs = msgs.filter((m, index, self) => 
        index === self.findIndex((t) => t.messageId === m.messageId)
      );
      // Sort by sentAt
      uniqueMsgs.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      
      setMessages(uniqueMsgs);
      // Update cache
      localStorage.setItem(`chat_messages_${roomId}`, JSON.stringify(uniqueMsgs));
      
    } catch (e) {
      console.error('Load messages error', e);
      // Fallback: If network fails, we rely on what we loaded from cache
      // If no cache and support room, set empty
      if (isSupportActive && messages.length === 0) {
         setMessages([]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return;
    
    try {
      await chatService.sendMessage(activeRoom.roomId, {
        content: newMessage,
        messageType: 'text'
      });
      setNewMessage('');
      loadMyRooms(); // Refresh room list to show updated last message/time
    } catch (e) {
      console.error('Send message error', e);
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const handleUserClick = (userId: string | number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate(`/chat/${userId}`);
  };

  const handleRoomClick = (room: ChatRoom, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate(`/chat/room/${room.roomId}`);
  };

  const handleSupportClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigate('/chat/support');
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  const isOwnMessage = (msg: ChatMessage) => {
    return String(msg.senderId) === String(currentUser?.id);
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchText.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', bgcolor: '#f5f7fb', py: 3 }}>
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Sidebar */}
          <Grid item xs={12} md={4} sx={{ 
            height: '100%',
            display: { xs: showMobileList ? 'block' : 'none', md: 'block' }
          }}>
            <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Đoạn chat</Typography>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm người dùng..."
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: <BiSearch style={{ marginRight: 8, color: '#666' }} />,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>
              
              <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                {/* Support Room Item */}
                <ListItem 
                  button 
                  selected={isSupportActive}
                  onClick={handleSupportClick}
                  sx={{ 
                    py: 2, 
                    borderBottom: '1px solid #f0f0f0',
                    bgcolor: isSupportActive ? '#e3f2fd' : 'transparent',
                    '&:hover': { bgcolor: isSupportActive ? '#e3f2fd' : '#f5f5f5' }
                  }}
                >
                  <ListItemAvatar>
                    <Badge color="success" variant="dot" overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                      <Avatar sx={{ bgcolor: '#1976d2' }}>
                        <BiSupport />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={<Typography fontWeight={600}>Hỗ trợ trực tuyến</Typography>}
                    secondary={<Typography variant="body2" noWrap color="text.secondary">Liên hệ với Admin</Typography>}
                  />
                </ListItem>

                {!isSupportActive && (
                  <>
                    <Divider />
                    
                    {/* Recent Rooms */}
                    {rooms.length > 0 && (
                      <>
                        <Box sx={{ px: 2, py: 1, bgcolor: '#fafafa' }}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">GẦN ĐÂY</Typography>
                        </Box>
                        {rooms.filter(r => r.roomType !== 'support').map(room => {
                          const isActive = activeRoom?.roomId === room.roomId;
                          return (
                            <ListItem 
                              key={room.roomId}
                              button 
                              selected={isActive}
                              onClick={(e) => handleRoomClick(room, e)}
                              sx={{ 
                                py: 1.5,
                                bgcolor: isActive ? '#e3f2fd' : 'transparent',
                                '&:hover': { bgcolor: isActive ? '#e3f2fd' : '#f5f5f5' }
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: '#ff5722' }}>
                                  {room.name?.charAt(0) || 'R'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText 
                                primary={<Typography fontWeight={isActive ? 600 : 400} noWrap>{room.name}</Typography>}
                                secondary={
                                  <Typography variant="body2" noWrap color="text.secondary">
                                    {room.lastMessage ? 
                                      `${isOwnMessage(room.lastMessage) ? 'Bạn: ' : ''}${room.lastMessage.content}` 
                                      : 'Chưa có tin nhắn'}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </>
                    )}

                    {isLoadingUsers ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      filteredUsers.map(user => {
                        // Check if we already have a room with this user to highlight differently?
                        // For now, just standard list
                        const isSelected = String(user.id) === targetUserId;
                        return (
                          <ListItem 
                            key={user.id}
                            button 
                            // selected={isSelected} // Only select if explicitly navigated via URL param, but usually activeRoom takes precedence
                            onClick={(e) => handleUserClick(user.id, e)}
                            sx={{ 
                              py: 1.5,
                              // bgcolor: isSelected ? '#e3f2fd' : 'transparent', // Conflict with room selection
                              '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                          >
                            <ListItemAvatar>
                              <Badge 
                                color={user.isActive ? "success" : "default"} 
                                variant="dot" 
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                invisible={!user.isActive}
                              >
                                <Avatar src={user.avatar || undefined} alt={user.fullName}>
                                  {user.fullName?.charAt(0) || 'U'}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<Typography fontWeight={400}>{user.fullName || user.username}</Typography>}
                              secondary={
                                <Typography variant="body2" noWrap color="text.secondary">
                                  {user.role === 'admin' ? 'Quản trị viên' : (user.role as string) === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                </Typography>
                              }
                            />
                          </ListItem>
                        );
                      })
                    )}
                  </>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Chat Window */}
          <Grid item xs={12} md={8} sx={{ 
            height: '100%',
            display: { xs: !showMobileList ? 'block' : 'none', md: 'block' }
          }}>
            <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
              {activeRoom ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', bgcolor: '#fff' }}>
                    <IconButton 
                      onClick={() => setShowMobileList(true)}
                      sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
                    >
                      <BiArrowBack />
                    </IconButton>
                    <Avatar 
                      src={isSupportActive ? undefined : (users.find(u => String(u.id) === targetUserId)?.avatar)}
                      sx={{ bgcolor: isSupportActive ? '#1976d2' : '#bdbdbd', mr: 2 }}
                    >
                      {isSupportActive ? <BiSupport /> : (users.find(u => String(u.id) === targetUserId)?.fullName?.charAt(0) || activeRoom?.name?.charAt(0) || 'U')}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {isSupportActive ? 'Chat với Admin' : activeRoom?.name || users.find(u => String(u.id) === targetUserId)?.fullName || 'Người dùng'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Messages Area */}
                  <Box 
                    ref={scrollContainerRef}
                    onScroll={onScroll}
                    sx={{ flexGrow: 1, overflow: 'auto', p: 3, bgcolor: '#f8f9fa' }}
                  >
                    {isLoadingMessages ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : messages.length === 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                        <Box sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}><BiSend /></Box>
                        <Typography>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</Typography>
                      </Box>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMine = isOwnMessage(msg);
                        return (
                          <Box 
                            key={idx} 
                            sx={{ 
                              display: 'flex', 
                              mb: 1.5, 
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              alignItems: 'flex-end'
                            }}
                          >
                            {!isMine && (
                              <Avatar 
                                src={msg.senderAvatar} 
                                sx={{ width: 28, height: 28, mr: 1, mb: 1 }}
                              />
                            )}
                            <Box 
                              sx={{ 
                                maxWidth: '60%', 
                                p: 1.5, 
                                borderRadius: 3,
                                bgcolor: isMine ? '#1976d2' : '#fff',
                                color: isMine ? '#fff' : '#000',
                                boxShadow: 1,
                                borderBottomRightRadius: isMine ? 4 : 24,
                                borderBottomLeftRadius: !isMine ? 4 : 24,
                              }}
                            >
                              <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>{msg.content}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', opacity: 0.8, fontSize: '0.7rem' }}>
                                {formatDateToTime(new Date(msg.sentAt))}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Input Area */}
                  <Box sx={{ p: 2, borderTop: '1px solid #eee', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Nhập tin nhắn..."
                        variant="outlined"
                        size="medium"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{ borderRadius: 3, px: 3, minWidth: 100 }}
                        endIcon={<BiSend />}
                      >
                        Gửi
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (isLoadingMessages || isSupportActive) ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography>{isSupportActive ? 'Đang kết nối hỗ trợ...' : 'Đang tải...'}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                  <Box sx={{ fontSize: 80, mb: 2, opacity: 0.2 }}><BiSend /></Box>
                  <Typography variant="h6">Chọn một người dùng để bắt đầu trò chuyện</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ChatPage;
