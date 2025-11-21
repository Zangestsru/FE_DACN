/**
 * Chat Service
 * Xử lý tất cả các chức năng liên quan đến chat và SignalR connection
 */

import * as signalR from '@microsoft/signalr';
import { apiService } from './api.service';
import { STORAGE_KEYS } from '@/constants';
import type {
  ChatMessage,
  ChatRoom,
  SendMessageRequest,
  CreateRoomRequest,
  ChatHistoryResponse
} from '@/types/chat.types';

const CHAT_API_BASE_URL = 'http://localhost:5004/api/Chat';
const SIGNALR_HUB_URL = 'http://localhost:5004/chatHub';

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

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR Connected');
      
      this.connectionPromise = null;
    } catch (error) {
      console.error('❌ SignalR Connection Error:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Setup các event handlers cho SignalR
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Nhận tin nhắn mới
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 New message received:', message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    // User đang typing
    this.connection.on('UserStartedTyping', (data: { userId: number; userName: string; roomId: number }) => {
      console.log('⌨️ User started typing:', data);
      this.typingCallbacks.forEach(callback => callback(data));
    });

    // User ngừng typing
    this.connection.on('UserStoppedTyping', (data: { userId: number; roomId: number }) => {
      console.log('⌨️ User stopped typing:', data);
    });

    // User online status changed
    this.connection.on('UserOnlineStatusChanged', (data: { userId: number; isOnline: boolean; roomId: number }) => {
      console.log('👤 User online status changed:', data);
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
      // Tìm room support chung (room có tên cố định)
      const rooms = await this.getUserRooms(1, 100);
      let generalRoom = rooms.find(room => 
        room.roomType === 'support' && 
        room.name === 'Hỗ trợ trực tuyến - General'
      );

      // Nếu user chưa là member của room chung, join vào
      if (!generalRoom) {
        // Tạo room mới nếu chưa có (chỉ lần đầu tiên)
        const request: CreateRoomRequest = {
          name: 'Hỗ trợ trực tuyến - General',
          description: 'Phòng hỗ trợ chung cho tất cả người dùng',
          roomType: 'support'
        };

        const response = await apiService.post(CHAT_API_BASE_URL, request);
        
        // Debug: Log response để xem structure
        console.log('📦 Create room response:', response);
        console.log('📦 Response.data:', response.data);
        
        // Try multiple ways to extract room data
        let roomData = null;
        
        // Try 1: response.data.data
        if (response.data?.data) {
          roomData = response.data.data;
        }
        // Try 2: response.data directly
        else if (response.data?.roomId) {
          roomData = response.data;
        }
        // Try 3: response directly (axios sometimes unwraps)
        else if (response.roomId) {
          roomData = response;
        }
        
        if (roomData && roomData.roomId) {
          generalRoom = roomData;
          console.log('✅ Room created/found:', generalRoom);
        } else {
          console.error('❌ Invalid response structure:', response);
          throw new Error('Invalid response structure from server');
        }
      }

      // Join room
      if (generalRoom) {
        await this.connect();
        await this.joinRoom(generalRoom.roomId);
        return generalRoom;
      }

      throw new Error('Failed to get general support room');
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
      const response = await apiService.get(
        CHAT_API_BASE_URL,
        { params: { page, pageSize } }
      );

      // Handle different response structures
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting user rooms:', error);
      return [];
    }
  }

  /**
   * Lấy lịch sử chat của room
   */
  async getChatHistory(roomId: number, page: number = 1, pageSize: number = 50): Promise<ChatHistoryResponse> {
    try {
      const response = await apiService.get(
        `${CHAT_API_BASE_URL}/${roomId}`,
        { params: { page, pageSize } }
      );

      // Handle different response structures
      return response.data?.data || response.data;
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
      const response = await apiService.post(
        `${CHAT_API_BASE_URL}/${roomId}`,
        request
      );

      // Handle different response structures
      return response.data?.data || response.data;
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
      await apiService.post(`${CHAT_API_BASE_URL}/${roomId}/join`);
      await this.connect();
      await this.joinRoom(roomId);
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  }

  /**
   * Lấy phòng chat support chung (tất cả users dùng chung 1 room)
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
}

// Export singleton instance
export const chatService = new ChatService();

