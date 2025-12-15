import * as signalR from '@microsoft/signalr';
import apiService from './api.service';
import { Notification } from '../types/notification.types';

const HUB_URL = '/chatHub'; // Assuming same hub for simplicity, or change to /notificationHub if known

class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private notificationCallbacks: ((notification: Notification) => void)[] = [];

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          return localStorage.getItem('accessToken') ||
            localStorage.getItem('access_token') ||
            localStorage.getItem('ACCESS_TOKEN') ||
            localStorage.getItem('token') || '';
        }
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (notification: Notification) => {
      this.notificationCallbacks.forEach(cb => cb(notification));
    });
  }

  private isStarting = false;

  async start() {
    // Prevent duplicate starts
    if (this.isStarting) {
      console.log('⚠️ Connection start already in progress');
      return;
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connection?.state !== signalR.HubConnectionState.Disconnected) {
      console.log(`⚠️ Connection already in state: ${this.connection?.state}`);
      return;
    }

    this.isStarting = true;
    try {
      await this.connection?.start();
      console.log('✅ Notification Hub Connected');
    } catch (err) {
      console.error('Error connecting to Notification Hub', err);
    } finally {
      this.isStarting = false;
    }
  }

  async stop() {
    if (this.connection?.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection?.stop();
      console.log('🔌 Notification Hub Disconnected');
    }
  }

  onNotification(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  async getNotifications(limit: number = 20): Promise<Notification[]> {
    try {
      // Use existing endpoint structure from NotificationDropdown
      const endpoint = '/notifications';
      const res: any = await apiService.get(`${endpoint}?limit=${limit}`);
      const data = res?.data ?? res;
      const list: any[] = Array.isArray(data) ? data : [];

      return list.map((n) => ({
        id: n.NotificationId ?? n.notificationId ?? 0,
        title: n.Title ?? n.title ?? "",
        message: n.Message ?? n.message ?? "",
        type: n.Type ?? n.type ?? 'system',
        createdAt: n.CreatedAt ?? n.createdAt ?? new Date().toISOString(),
        isRead: n.IsRead ?? n.isRead ?? false,
      }));
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      return [];
    }
  }

  async markAsRead(id: number) {
    try {
      await apiService.put(`/notifications/${id}/read`, {});
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  }

  // Method to simulate receiving a notification for testing
  simulateNotification(notification: Notification) {
    this.notificationCallbacks.forEach(cb => cb(notification));
  }
}

export const notificationService = new NotificationService();
