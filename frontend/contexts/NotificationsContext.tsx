"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Notification {
  id: number;
  type: string;
  refinery_name: string;
  refinery_system: string;
  job_type: string;
  end_time: string;
  hours_ready: number;
  materials_count: number;
}

interface NotificationsContextType {
  count: number;
  notifications: Notification[];
  loading: boolean;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  count: 0,
  notifications: [],
  loading: false,
  refresh: () => {}
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/production/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationsContext.Provider value={{ count, notifications, loading, refresh: loadNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}