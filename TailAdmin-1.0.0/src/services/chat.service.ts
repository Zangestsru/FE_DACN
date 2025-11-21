/**
 * Admin Chat Service
 * Xử lý chat cho admin - xem và trả lời tất cả support rooms
 */

import * as signalR from '@microsoft/signalr';
import axios from 'axios';

const CHAT_API_BASE_URL = 'http://localhost:5004/api/Chat';
const SIGNALR_HUB_URL = 'http://localhost:5004/chatHub';

export interface ChatMessage {
  messageId: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  attachmentName?: string;
  replyToMessageId?: number;
  replyToMessage?: ChatMessage;
  sentAt: Date | string;
  isEdited: boolean;
  editedAt?: Date | string;
}

export interface ChatRoom {
  roomId: number;
  name: string;
  description?: string;
  roomType: 'general' | 'course' | 'exam' | 'private' | 'support';
  createdBy: number;
  creatorName: string;
  createdAt: Date | string;
  isActive: boolean;
  memberCount: number;
  lastMessage?: ChatMessage;
}

export interface ChatHistoryResponse {
  room: ChatRoom;
  messages: ChatMessage[];
  totalMessages: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

class AdminChatService {
  private connection: signalR.HubConnection | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private connectionPromise: Promise<void> | null = null;

  /**
   * Get axios instance with auth token
   */
  private getAxiosInstance() {
    // Try multiple token keys
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('ACCESS_TOKEN') ||
                  localStorage.getItem('token');
    
    console.log('🔑 Admin token:', token ? 'Found' : 'Not found');
    
    return axios.create({
      baseURL: CHAT_API_BASE_URL,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Connect to SignalR Hub
   */
  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      // Try multiple token keys
      const token = localStorage.getItem('accessToken') || 
                    localStorage.getItem('access_token') ||
                    localStorage.getItem('ACCESS_TOKEN') ||
                    localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No access token found. SignalR will not connect.');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        this.connectionPromise = null;
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
          skipNegotiation: false
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning) // Less verbose
        .build();

      this.setupEventHandlers();
      await this.connection.start();
      console.log('✅ Admin SignalR Connected');
      
      this.connectionPromise = null;
    } catch (error) {
      console.warn('⚠️ Admin SignalR failed to connect. Using REST API only.', error);
      this.connection = null;
      this.connectionPromise = null;
      // Don't throw - allow app to work without SignalR
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('📨 Admin received message:', message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.connection.on('Error', (errorMessage: string) => {
      console.error('❌ SignalR Error:', errorMessage);
    });

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
   * Disconnect from SignalR
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
      console.log('🔌 Admin SignalR Disconnected');
    }
  }

  /**
   * Subscribe to new messages
   */
  onMessageReceived(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Join room
   */
  async joinRoom(roomId: number): Promise<void> {
    await this.ensureConnected();
    if (this.connection) {
      await this.connection.invoke('JoinRoom', roomId);
      console.log(`✅ Admin joined room ${roomId}`);
    }
  }

  /**
   * Leave room
   */
  async leaveRoom(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveRoom', roomId);
      console.log(`👋 Admin left room ${roomId}`);
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.connect();
    }
  }

  // ==================== REST API Methods ====================

  /**
   * Get all rooms (admin can see all support rooms)
   */
  async getAllRooms(page: number = 1, pageSize: number = 50): Promise<{ data: ChatRoom[]; success: boolean }> {
    try {
      const api = this.getAxiosInstance();
      const response = await api.get('', { params: { page, pageSize } });
      
      // Handle different response structures
      const rooms = response.data?.data || response.data;
      return { 
        data: Array.isArray(rooms) ? rooms : [], 
        success: true 
      };
    } catch (error) {
      console.error('Error getting all rooms:', error);
      return { data: [], success: false };
    }
  }

  /**
   * Get chat history for a room
   */
  async getChatHistory(roomId: number, page: number = 1, pageSize: number = 100): Promise<ChatHistoryResponse | null> {
    try {
      const api = this.getAxiosInstance();
      const response = await api.get(`/${roomId}`, { params: { page, pageSize } });
      
      // Handle different response structures
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return null;
    }
  }

  /**
   * Send message as admin
   */
  async sendMessage(roomId: number, content: string): Promise<ChatMessage | null> {
    try {
      const api = this.getAxiosInstance();
      const response = await api.post(`/${roomId}`, {
        content,
        messageType: 'text'
      });

      // Handle different response structures
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Join room (become member)
   */
  async joinChatRoom(roomId: number): Promise<boolean> {
    try {
      const api = this.getAxiosInstance();
      await api.post(`/${roomId}/join`);
      await this.connect();
      await this.joinRoom(roomId);
      return true;
    } catch (error) {
      console.error('Error joining chat room:', error);
      return false;
    }
  }
}

// Export singleton
export const adminChatService = new AdminChatService();

