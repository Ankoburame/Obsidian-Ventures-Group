"use client";

import React, { useState, useEffect } from 'react';
import { Users, Trash2, Key, Plus, Shield } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  cyan: "#06b6d4",
  magenta: "#ec4899",
  orange: "#f97316",
  red: "#ef4444",
  green: "#10b981",
  bgDark: "#0a0e1a",
  bgMedium: "#151b2e",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
};

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadUsers();
    }
  }, [mounted]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newUserPassword) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newUserPassword,
          is_admin: newUserIsAdmin
        })
      });

      if (res.ok) {
        setMessage('User created');
        setShowCreateModal(false);
        setNewUsername('');
        setNewEmail('');
        setNewUserPassword('');
        setNewUserIsAdmin(false);
        loadUsers();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        setMessage(`Error: ${error.detail}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Delete ${username}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage(`${username} deleted`);
        loadUsers();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: !currentStatus })
      });

      if (res.ok) {
        setMessage(`Admin role ${!currentStatus ? 'granted' : 'revoked'}`);
        loadUsers();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${COLORS.bgMedium}, ${COLORS.bgDark})`,
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            color: COLORS.cyan,
            fontFamily: 'monospace',
            textTransform: 'uppercase'
          }}>
            ADMIN - USERS
          </h1>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.cyan})`,
              border: 'none',
              borderRadius: '6px',
              color: COLORS.bgDark,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} />
            CREATE USER
          </button>
        </div>

        {message && (
          <div style={{
            padding: '16px',
            background: `${COLORS.cyan}20`,
            border: `2px solid ${COLORS.cyan}`,
            borderRadius: '8px',
            color: COLORS.cyan,
            marginBottom: '24px',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <div style={{
          background: COLORS.bgMedium,
          border: `1px solid ${COLORS.cyan}40`,
          borderRadius: '8px',
          padding: '24px'
        }}>
          {users.map(user => (
            <div
              key={user.id}
              style={{
                padding: '16px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.cyan}20`,
                borderRadius: '6px',
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '14px',
                  color: COLORS.textPrimary,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {user.username}
                  {user.is_admin && (
                    <span style={{
                      fontSize: '10px',
                      background: COLORS.magenta,
                      color: COLORS.bgDark,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.textSecondary,
                  marginTop: '4px'
                }}>
                  {user.email}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => toggleAdmin(user.id, user.is_admin)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: user.is_admin ? `${COLORS.orange}30` : `${COLORS.green}30`,
                    border: `1px solid ${user.is_admin ? COLORS.orange : COLORS.green}`,
                    borderRadius: '4px',
                    color: user.is_admin ? COLORS.orange : COLORS.green,
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Shield size={12} />
                  {user.is_admin ? 'REVOKE' : 'GRANT'}
                </button>
                <button
                  onClick={() => deleteUser(user.id, user.username)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: `${COLORS.red}30`,
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: '4px',
                    color: COLORS.red,
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={12} />
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: COLORS.bgMedium,
            border: `2px solid ${COLORS.green}`,
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{
              fontSize: '20px',
              color: COLORS.green,
              textTransform: 'uppercase',
              marginBottom: '24px',
              fontFamily: 'monospace'
            }}>
              CREATE NEW USER
            </h2>

            <form onSubmit={createUser}>
              <input
                type="text"
                placeholder="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `2px solid ${COLORS.green}60`,
                  borderRadius: '4px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `2px solid ${COLORS.green}60`,
                  borderRadius: '4px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `2px solid ${COLORS.green}60`,
                  borderRadius: '4px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '24px',
                color: COLORS.textPrimary,
                fontFamily: 'monospace',
                fontSize: '13px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                />
                Grant Admin Role
              </label>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: `${COLORS.red}30`,
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: '6px',
                    color: COLORS.red,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.cyan})`,
                    border: 'none',
                    borderRadius: '6px',
                    color: COLORS.bgDark,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'monospace',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
