"use client";

import React, { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  cyan: "#06b6d4",
  orange: "#f97316",
  red: "#ef4444",
  bgDark: "#0a0e1a",
  bgMedium: "#151b2e",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
};

interface User {
  id: number;
  username: string;
}

interface InventoryItem {
  id: number;
  material_name: string;
  quantity: number;
  unit: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const loadInventory = async (userId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users/${userId}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (e) {
      console.error('Failed to load inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (invId: number) => {
    if (!confirm('Delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/inventory/${invId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadInventory(selectedUserId);
      }
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgDark} 0%, ${COLORS.bgMedium} 100%)`,
        border: `2px solid ${COLORS.cyan}`,
        borderRadius: '8px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: `0 0 40px ${COLORS.cyan}60`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${COLORS.cyan}40`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            color: COLORS.cyan,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontFamily: 'monospace',
            margin: 0,
            textShadow: `0 0 10px ${COLORS.cyan}`
          }}>
            ADMIN SETTINGS
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textPrimary,
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '20px',
          padding: '20px',
          overflow: 'auto',
          flex: 1
        }}>
          {/* Users List */}
          <div>
            <input
              type="text"
              placeholder="Search user..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.cyan}60`,
                borderRadius: '4px',
                color: COLORS.textPrimary,
                fontSize: '12px',
                fontFamily: 'monospace',
                marginBottom: '12px',
                outline: 'none'
              }}
            />

            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    loadInventory(user.id);
                  }}
                  style={{
                    padding: '12px',
                    background: selectedUserId === user.id ? `${COLORS.cyan}30` : COLORS.bgDark,
                    border: `1px solid ${selectedUserId === user.id ? COLORS.cyan : `${COLORS.cyan}20`}`,
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: COLORS.textPrimary,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUserId !== user.id) {
                      e.currentTarget.style.background = `${COLORS.cyan}15`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUserId !== user.id) {
                      e.currentTarget.style.background = COLORS.bgDark;
                    }
                  }}
                >
                  {user.username}
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div>
            {selectedUserId === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: COLORS.textSecondary,
                fontFamily: 'monospace'
              }}>
                Select a user to view inventory
              </div>
            ) : loading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: COLORS.textSecondary,
                fontFamily: 'monospace'
              }}>
                Loading...
              </div>
            ) : inventory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: COLORS.textSecondary,
                fontFamily: 'monospace'
              }}>
                No inventory items
              </div>
            ) : (
              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {inventory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px',
                      background: COLORS.bgDark,
                      border: `1px solid ${COLORS.orange}40`,
                      borderRadius: '4px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        {item.material_name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: COLORS.orange
                      }}>
                        {item.quantity} {item.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        padding: '8px 12px',
                        background: `${COLORS.red}30`,
                        border: `1px solid ${COLORS.red}`,
                        borderRadius: '4px',
                        color: COLORS.red,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      <Trash2 size={14} />
                      DELETE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
