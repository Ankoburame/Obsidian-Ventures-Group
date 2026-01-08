"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const COLORS = {
  orange: "#d97706",
  red: "#dc2626",
  yellow: "#eab308",
  greenOlive: "#84a98c",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  textPrimary: "#e2e8f0",
};

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContextType {
  showToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, type, message };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'error': return <XCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
    }
  };

  const getColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return COLORS.greenOlive;
      case 'error': return COLORS.red;
      case 'warning': return COLORS.yellow;
      case 'info': return COLORS.orange;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          const color = getColor(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
                border: `1px solid ${color}80`,
                borderRadius: '4px',
                padding: '16px 20px',
                minWidth: '320px',
                maxWidth: '420px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: `0 4px 12px ${COLORS.bgDark}80, 0 0 20px ${color}30`,
                pointerEvents: 'auto',
                animation: 'slideIn 0.3s ease-out',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: color
              }} />

              {/* Icon */}
              <div style={{ color, flexShrink: 0, marginLeft: '8px' }}>
                {getIcon(toast.type)}
              </div>

              {/* Message */}
              <div style={{
                flex: 1,
                color: COLORS.textPrimary,
                fontSize: '13px',
                fontFamily: 'monospace',
                lineHeight: '1.5'
              }}>
                {toast.message}
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.textPrimary,
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
