export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'payment' | 'message' | 'system';
  createdAt: string;
  isRead: boolean;
}
