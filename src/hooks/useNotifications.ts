// src/hooks/useNotifications.ts

import { useCallback } from 'react';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Hook for showing user notifications
 * This is a simple implementation - in a real app you might use a toast library
 */
export function useNotifications() {
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // For now, just log to console - in production this would show a toast
    const logMethod = notification.type === 'error' ? console.error :
                     notification.type === 'warning' ? console.warn :
                     console.info;
    
    logMethod(`[${notification.type.toUpperCase()}] ${notification.title}`, notification.message);
    
    // In a real implementation, this would add to a toast notification system
    // For now, we'll use a simple alert for critical errors
    if (notification.type === 'error') {
      // Only show alert for critical errors to avoid spam
      setTimeout(() => {
        alert(`Error: ${notification.title}\n${notification.message || ''}`);
      }, 100);
    }
    
    return id;
  }, []);

  const showError = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'error', title, message });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'warning', title, message });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'info', title, message });
  }, [showNotification]);

  const showSuccess = useCallback((title: string, message?: string) => {
    return showNotification({ type: 'success', title, message });
  }, [showNotification]);

  return {
    showNotification,
    showError,
    showWarning,
    showInfo,
    showSuccess
  };
}
