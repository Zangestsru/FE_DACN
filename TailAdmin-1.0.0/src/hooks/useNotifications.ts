import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification.service';
import { Notification } from '../types/notification.types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const data = await notificationService.getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.isRead).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchNotifications();

    const startConnection = async () => {
      if (mounted) {
        await notificationService.start();
      }
    };
    startConnection();

    const unsubscribe = notificationService.onNotification((notification) => {
      if (!mounted) return;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setNewNotification(notification);

      // Clear popup after 5 seconds
      setTimeout(() => {
        if (mounted) setNewNotification(null);
      }, 5000);
    });

    return () => {
      mounted = false;
      unsubscribe();
      notificationService.stop();
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    // Implement if API supports it, otherwise loop
    // For now, just optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    newNotification, // For the popup
    fetchNotifications
  };
};
