import * as signalR from '@microsoft/signalr';
import { apiService } from './api.service';
import type {
  ChatMessage,
  ChatRoom,
  SendMessageRequest,
  ChatHistoryResponse,
  NotificationItem
} from '../types/chat.types';

// Use relative path for SignalR to leverage Vite proxy (dev) or Nginx (prod)
// This avoids CORS issues and ensures requests go through the same channel as the app
const SIGNALR_HUB_URL = '/chatHub';

// Use absolute URL pointing to frontend origin to ensure requests go through Vite proxy
const CHAT_API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/Chat`
  : '/api/Chat';

class ChatService {
  private connection: signalR.HubConnection | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((data: { userId: number; userName: string; roomId: number }) => void)[] = [];
  private notificationCallbacks: ((notification: NotificationItem) => void)[] = [];
  
  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect().finally(() => {
      this.isConnecting = false;
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      // Get token from localStorage
      let token = localStorage.getItem('authToken');
      if (!token) {
        token = localStorage.getItem('access_token') || '';
      }
      
      if (!token) {
        console.warn('No access token found. Cannot connect to chat hub.');
        return;
      }

      // If connection exists but is disconnected, we can reuse or rebuild. 
      // Safest is to rebuild to ensure clean state.
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch (e) {
          // Ignore error on stop
        }
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => token!,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupEventHandlers();

      await this.connection.start();
      console.log('✅ SignalR Connected');
      
    } catch (error) {
      console.error('❌ SignalR Connection Error:', error);
      // If we failed to connect, we should clear the promise so we can try again
      this.connectionPromise = null;
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR Disconnected');
      } catch (error) {
        console.error('Error disconnecting SignalR:', error);
      } finally {
        this.connection = null;
        this.connectionPromise = null;
      }
    }
  }

  // Event Listeners Management

  onMessageReceived(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onUserTyping(callback: (data: { userId: number; userName: string; roomId: number }) => void): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  onNotificationReceived(callback: (notification: NotificationItem) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyMessageListeners(message: ChatMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 New message received:', message);
      this.notifyMessageListeners(message);
    });

    this.connection.on('UserStartedTyping', (data: { userId: number; userName: string; roomId: number }) => {
      this.typingCallbacks.forEach(callback => callback(data));
    });

    this.connection.on('UserStoppedTyping', (data: { userId: number; roomId: number }) => {
      // Handle stopped typing if needed
    });

    this.connection.on('JoinedRoom', (roomId: number) => {
      console.log('✅ Server confirmed join room:', roomId);
    });

    this.connection.on('NotificationReceived', (notification: NotificationItem) => {
      console.log('🔔 Notification received:', notification);
      this.notificationCallbacks.forEach(callback => callback(notification));
    });
  }

  // SignalR Actions

  async joinRoom(roomId: number): Promise<void> {
    await this.ensureConnected();
    if (this.connection) {
      try {
        await this.connection.invoke('JoinRoom', roomId);
      } catch (e) {
        console.error(`Error joining room ${roomId}:`, e);
      }
    }
  }

  async leaveRoom(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveRoom', roomId);
      } catch (e) {
        console.error(`Error leaving room ${roomId}:`, e);
      }
    }
  }

  async startTyping(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StartTyping', roomId).catch(() => {});
    }
  }

  async stopTyping(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('StopTyping', roomId).catch(() => {});
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
  }

  // REST API Methods

  async getUserRooms(page: number = 1, pageSize: number = 20): Promise<ChatRoom[]> {
    try {
      // We explicitly use the CHAT_API_BASE_URL (proxied) 
      // We pass the full URL to apiService.get
      const rooms = await apiService.get<ChatRoom[]>(`${CHAT_API_BASE_URL}?page=${page}&pageSize=${pageSize}`);
      return Array.isArray(rooms) ? rooms : [];
    } catch (error) {
      console.error('Error getting user rooms:', error);
      return [];
    }
  }

  async getChatHistory(roomId: number, page: number = 1, pageSize: number = 50): Promise<ChatHistoryResponse> {
    try {
      return await apiService.get<ChatHistoryResponse>(`${CHAT_API_BASE_URL}/${roomId}?page=${page}&pageSize=${pageSize}`);
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async sendMessage(roomId: number, request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const message = await apiService.post<ChatMessage>(`${CHAT_API_BASE_URL}/${roomId}`, request);
      if (message) {
        // Optimistically notify listeners or let SignalR handle it? 
        // Usually SignalR broadcasts back, but for immediate UI feedback we might want to add it.
        // But let's stick to existing logic: notifyMessageListeners was called in original code.
        this.notifyMessageListeners(message);
      }
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async joinChatRoom(roomId: number): Promise<void> {
    try {
      await apiService.post(`${CHAT_API_BASE_URL}/${roomId}/join`, {});
      try {
        await this.connect();
        await this.joinRoom(roomId);
      } catch (e) {
        console.warn('Join via SignalR failed, continue with REST', e);
      }
    } catch (error: any) {
        // Ignore if already joined
        if (error?.status === 400) return;
        throw error;
    }
  }

  async getOrCreatePrivateRoom(targetUserId: number | string): Promise<ChatRoom> {
    try {
      const response: any = await apiService.post(`${CHAT_API_BASE_URL}/private/${targetUserId}`, {});
      if (response && response.data) return response.data;
      return response as ChatRoom;
    } catch (error) {
      console.error('Error getting or creating private room:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
