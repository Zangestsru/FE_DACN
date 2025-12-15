/**
 * Chat Service
 * Xử lý tất cả các chức năng liên quan đến chat và SignalR connection
 */

import * as signalR from '@microsoft/signalr';
import { apiService, API_BASE_URL } from './api.service';
import { STORAGE_KEYS } from '@/constants';
import type {
  ChatMessage,
  ChatRoom,
  SendMessageRequest,
  CreateRoomRequest,
  ChatHistoryResponse
} from '@/types/chat.types';

const CHAT_API_BASE_URL = '/Chat';
const FEEDBACK_API_BASE_URL = '/feedback';
const SIGNALR_HUB_URL = `${API_BASE_URL}/chatHub`;

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((data: { userId: number; userName: string; roomId: number }) => void)[] = [];
  private connectionPromise: Promise<void> | null = null;

  /**
   * Khởi tạo và connect đến SignalR Hub
   */
  async connect(): Promise<void> {
    // Nếu đang connecting, return promise hiện tại
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Nếu đã connected, return luôn
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        console.warn('No access token found. Cannot connect to chat hub.');
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0, 2, 10, 30 seconds
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start connection only if disconnected
      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        await this.connection.start();
        console.log('✅ SignalR Connected');
      }

      this.connectionPromise = null;
    } catch (error) {
      console.error('❌ SignalR Connection Error:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Notify all listeners about a new message
   */
  private notifyMessageListeners(message: ChatMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
    // Dispatch global event for non-React parts or cross-component sync
    window.dispatchEvent(new CustomEvent('chat-message-received', { detail: message }));
  }

  /**
   * Setup các event handlers cho SignalR
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Nhận tin nhắn mới (lowercase)
    this.connection.on('receivemessage', (message: ChatMessage) => {
      console.log('📨 New message received:', message);
      this.notifyMessageListeners(message);
    });

    // Fallback for PascalCase
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 New message received (Pascal):', message);
      this.notifyMessageListeners(message);
    });

    // User đang typing
    this.connection.on('userstartedtyping', (data: { userId: number; userName: string; roomId: number }) => {
      console.log('⌨️ User started typing:', data);
      this.typingCallbacks.forEach(callback => callback(data));
    });

    // User ngừng typing
    this.connection.on('userstoppedtyping', (data: { userId: number; roomId: number }) => {
      console.log('⌨️ User stopped typing:', data);
    });

    // User online status changed
    this.connection.on('useronlinestatuschanged', (data: { userId: number; isOnline: boolean; roomId: number }) => {
      console.log('👤 User online status changed:', data);
    });

    // JoinedRoom confirmation
    this.connection.on('joinedroom', (roomId: number) => {
      console.log('✅ Server confirmed join room:', roomId);
    });

    // Error
    this.connection.on('Error', (errorMessage: string) => {
      console.error('❌ SignalR Error:', errorMessage);
    });

    // Connection events
    this.connection.onreconnecting((error) => {
      console.warn('🔄 SignalR Reconnecting...', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR Reconnected:', connectionId);
    });

    this.connection.onclose((error) => {
      console.warn('🔌 SignalR Connection Closed', error);
      this.connectionPromise = null;
    });
  }

  /**
   * Disconnect khỏi SignalR Hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
      console.log('🔌 SignalR Disconnected');
    }
  }

  /**
   * Subscribe nhận tin nhắn mới
   */
  onMessageReceived(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe nhận typing events
   */
  onUserTyping(callback: (data: { userId: number; userName: string; roomId: number }) => void): () => void {
    this.typingCallbacks.push(callback);

    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Join vào một room cụ thể
   */
  async joinRoom(roomId: number): Promise<void> {
    await this.ensureConnected();
    if (this.connection) {
      await this.connection.invoke('JoinRoom', roomId);
      console.log(`✅ Joined room ${roomId}`);
    }
  }

  /**
   * Leave khỏi room
   */
  async leaveRoom(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveRoom', roomId);
      console.log(`👋 Left room ${roomId}`);
    }
  }

  /**
   * Báo đang typing
   */
  async startTyping(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StartTyping', roomId);
    }
  }

  /**
   * Ngừng typing
   */
  async stopTyping(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StopTyping', roomId);
    }
  }

  /**
   * Ensure connection trước khi invoke methods
   */
  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
  }

  // ==================== REST API Methods ====================

  /**
   * Tạo hoặc lấy phòng chat support chung cho TẤT CẢ users
   */
  async getGeneralSupportRoom(): Promise<ChatRoom> {
    try {
      const rooms = await this.getUserRooms(1, 100);
      const currentUserId = this.getCurrentUserId();

      // Find ANY support room, sort by ID descending (newest first)
      // Do not restrict by createdBy, as Admin might have created it
      const supportRooms = rooms.filter(
        (room) => String(room.roomType).toLowerCase() === 'support'
      ).sort((a, b) => b.roomId - a.roomId);

      let generalRoom = supportRooms.length > 0 ? supportRooms[0] : undefined;

      if (!generalRoom) {
        const currentUser = this.getCurrentUser();
        const displayName = (currentUser?.fullName || currentUser?.username || currentUser?.name);
        const safeName = displayName ? displayName : `User ${currentUserId}`;
        const request: CreateRoomRequest = {
          name: `Hỗ trợ trực tuyến - ${safeName}`,
          description: 'Phòng hỗ trợ riêng giữa người dùng và admin',
          roomType: 'support',
        };

        const created: ChatRoom = await apiService.post(CHAT_API_BASE_URL, request);
        if (!created || !created.roomId) {
          throw new Error('Invalid response when creating room');
        }
        generalRoom = created;
        console.log('✅ Room created/found:', generalRoom);
      }

      await this.connect();
      await this.joinRoom(generalRoom.roomId);
      return generalRoom;
    } catch (error) {
      console.error('Error getting general support room:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách phòng chat của user
   */
  async getUserRooms(page: number = 1, pageSize: number = 20): Promise<ChatRoom[]> {
    try {
      const rooms = await apiService.get<ChatRoom[]>(CHAT_API_BASE_URL, { params: { page, pageSize } });
      return Array.isArray(rooms) ? rooms : [];
    } catch (error) {
      console.error('Error getting user rooms:', error);
      return [];
    }
  }

  /**
   * Lấy lịch sử chat của room
   */
  async getChatHistory(
    roomId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ChatHistoryResponse> {
    try {
      const history = await apiService.get<ChatHistoryResponse>(`${CHAT_API_BASE_URL}/${roomId}`, {
        params: { page, pageSize },
      });
      return history;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage(roomId: number, request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const message = await apiService.post<ChatMessage>(`${CHAT_API_BASE_URL}/${roomId}`, request);

      // Notify listeners (including self) about the sent message
      // This ensures all UI components (ChatPage, ChatWidget) stay in sync
      if (message) {
        this.notifyMessageListeners(message);
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Tham gia phòng chat
   */
  async joinChatRoom(roomId: number): Promise<void> {
    try {
      await apiService.post(`${CHAT_API_BASE_URL}/${roomId}/join`).catch((err: any) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || '';
        if (status === 400 && (msg.includes('đã tham gia') || msg.includes('tham gia phòng chat này rồi'))) {
          // Đã là thành viên, coi như thành công
          return;
        }
        throw err;
      });

      try {
        await this.connect();
        await this.joinRoom(roomId);
      } catch (e) {
        // Không chặn luồng nếu SignalR lỗi, vẫn dùng REST
        console.warn('Join via SignalR failed, continue with REST', e);
      }
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  }

  /**
   * Tạo hoặc lấy phòng chat support chung (tất cả users dùng chung 1 room)
   */
  async getOrCreateSupportRoom(): Promise<ChatRoom> {
    try {
      return await this.getGeneralSupportRoom();
    } catch (error) {
      console.error('Error getting or creating support room:', error);
      throw error;
    }
  }

  /**
   * Tạo hoặc lấy phòng chat private với user khác
   */
  async getOrCreatePrivateRoom(targetUserId: number): Promise<ChatRoom> {
    try {
      const response: any = await apiService.post(`${CHAT_API_BASE_URL}/private/${targetUserId}`);
      // apiService usually returns response.data directly if configured, or axios response.
      // Based on other methods, it seems apiService.get<T> returns T.
      // Let's assume apiService.post returns the response body.
      // The backend returns { success: true, data: ChatRoomResponse }

      if (response && response.data) {
        return response.data;
      }
      return response as ChatRoom;
    } catch (error) {
      console.error('Error getting or creating private room:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from token
   */
  private getCurrentUserId(): number {
    // Try USER_INFO first (correct key)
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO) ||
      localStorage.getItem('user') ||
      localStorage.getItem('USER');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.userId || user.id || user.UserId || 0;
      } catch (e) {
        console.error('Error parsing user ID:', e);
        return 0;
      }
    }
    return 0;
  }

  private getCurrentUser(): any {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO) ||
      localStorage.getItem('user') ||
      localStorage.getItem('USER');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user object:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Gửi feedback (rating và comment)
   */
  async submitFeedback(stars: number, comment?: string, examId?: number | string): Promise<any> {
    try {
      const payload: any = {
        stars,
        comment: comment || null
      };

      // Thêm examId nếu có
      if (examId) {
        payload.examId = typeof examId === 'string' ? parseInt(examId, 10) : examId;
      }

      const response = await apiService.post(FEEDBACK_API_BASE_URL, payload);
      // apiService.post trả về response.data hoặc response tùy cấu hình
      // Kiểm tra nếu có success field
      if (response && typeof response === 'object' && 'success' in response) {
        return response;
      }
      // Nếu không có, wrap lại
      return { success: true, data: response };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Lấy feedback theo examId
   */
  async getFeedbackByExam(examId: number | string): Promise<any> {
    try {
      const examIdNum = typeof examId === 'string' ? parseInt(examId, 10) : examId;
      const response = await apiService.get(`${FEEDBACK_API_BASE_URL}/exam/${examIdNum}`);
      return response;
    } catch (error: any) {
      // Nếu 404, có thể endpoint chưa tồn tại - trả về empty array thay vì throw
      if (error?.statusCode === 404 || error?.status === 404) {
        console.warn(`Feedback endpoint not found for exam ${examId}. Backend may need to be restarted.`);
        return { success: true, data: [] };
      }
      console.error('Error getting feedback by exam:', error);
      throw error;
    }
  }

  /**
   * Lấy feedback của user hiện tại cho exam
   */
  async getMyFeedbackForExam(examId: number | string): Promise<any> {
    try {
      const examIdNum = typeof examId === 'string' ? parseInt(examId, 10) : examId;
      const response = await apiService.get(`${FEEDBACK_API_BASE_URL}/my/exam/${examIdNum}`);
      return response;
    } catch (error: any) {
      // Nếu 404, có thể endpoint chưa tồn tại - trả về null thay vì throw
      if (error?.statusCode === 404 || error?.status === 404) {
        console.warn(`My feedback endpoint not found for exam ${examId}. Backend may need to be restarted.`);
        return { success: true, data: null };
      }
      console.error('Error getting my feedback for exam:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
