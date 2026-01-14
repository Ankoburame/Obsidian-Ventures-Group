"use client";

import { useNotifications } from '@/contexts/NotificationsContext';

export default function TestNotifications() {
  const { count, notifications, loading } = useNotifications();

  return (
    <div style={{ padding: '32px', color: 'white' }}>
      <h1>Test Notifications</h1>
      <p>Count: {count}</p>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Notifications: {JSON.stringify(notifications, null, 2)}</p>
    </div>
  );
}