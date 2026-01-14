"use client";

import { Menu, Wifi, Settings, User, Bell, Search, LogOut, Home, Lock, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SettingsModal } from '@/components/SettingsModal';
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type TopbarProps = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

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

export function Topbar({ sidebarOpen, toggleSidebar }: TopbarProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Notifications state (direct, sans contexte)
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Charger l'utilisateur depuis localStorage
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
    window.addEventListener("user-login", loadUser);

    return () => {
      window.removeEventListener("user-login", loadUser);
    };
  }, []);

  // Timer
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        console.log("🔔 Loading notifications...");
        const res = await fetch(`${API_URL}/production/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("🔔 Response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("🔔 Notifications data:", data);
          setCount(data.count || 0);
          setNotifications(data.notifications || []);
        }
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    }

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleUserClick = () => {
    if (!user) {
      router.push("/login");
    } else {
      setUserMenuOpen(!userMenuOpen);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to change password");
      }

      // Success
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <header
        style={{
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "linear-gradient(90deg, #0a0e1a 0%, #050810 100%)",
          borderBottom: "1px solid rgba(6, 182, 212, 0.1)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, #06b6d4 50%, transparent 100%)",
            opacity: 0.3,
          }}
        />

        {/* LEFT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button
            onClick={toggleSidebar}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(6, 182, 212, 0.05)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              borderRadius: "8px",
              color: "#06b6d4",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
            }}
          >
            <Menu style={{ width: "20px", height: "20px" }} />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Logo OVG Icon */}
            <div
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: "drop-shadow(0 0 15px rgba(6, 182, 212, 0.5))",
              }}
            >
              <Image
                src="/images/logo/ovg_icon_only.svg"
                alt="OVG"
                width={36}
                height={36}
                priority
              />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#22d3ee",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                OBSIDIAN VENTURES GROUP
              </h1>
              <div
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  letterSpacing: "1px",
                  marginTop: "2px",
                }}
              >
                Resource Management System
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid rgba(82, 82, 91, 0.3)",
              borderRadius: "8px",
              color: "#71717a",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
              e.currentTarget.style.color = "#06b6d4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(82, 82, 91, 0.3)";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <Search style={{ width: "18px", height: "18px" }} />
          </button>

          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid rgba(82, 82, 91, 0.3)",
              borderRadius: "8px",
              color: "#71717a",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
              e.currentTarget.style.color = "#06b6d4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(82, 82, 91, 0.3)";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            <Bell style={{ width: "18px", height: "18px" }} />
            {count > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "6px",
                  height: "6px",
                  background: "#ef4444",
                  borderRadius: "50%",
                  boxShadow: "0 0 8px #ef4444",
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "60px",
                right: "80px",
                width: "360px",
                maxHeight: "480px",
                background: "#18181b",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                zIndex: 1000,
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: "16px",
                borderBottom: "1px solid rgba(82, 82, 91, 0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Notifications
                </span>
                <span style={{ fontSize: "12px", color: "#06b6d4" }}>
                  {count} {count === 1 ? 'job ready' : 'jobs ready'}
                </span>
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "#71717a" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        router.push('/production');
                        setNotificationsOpen(false);
                      }}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid rgba(82, 82, 91, 0.2)",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
                        🟢 {notif.job_type === 'mining' ? 'Refining' : 'Salvage'} Job Ready
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                        {notif.refinery_name} • {notif.refinery_system}
                      </div>
                      <div style={{ fontSize: "11px", color: "#71717a" }}>
                        Ready {notif.hours_ready}h ago • {notif.materials_count} materials
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div style={{ width: "1px", height: "24px", background: "rgba(82, 82, 91, 0.3)" }} />

          {currentTime && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#06b6d4",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                {currentTime.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div style={{ fontSize: "10px", color: "#52525b", fontFamily: "monospace" }}>
                {currentTime.toLocaleDateString("fr-FR")}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "20px",
            }}
          >
            <Wifi style={{ width: "14px", height: "14px", color: "#10b981" }} />
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, letterSpacing: "0.5px" }}>
              ONLINE
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid rgba(82, 82, 91, 0.3)",
              borderRadius: "8px",
              color: "#71717a",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
              e.currentTarget.style.color = "#06b6d4";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(82, 82, 91, 0.3)";
              e.currentTarget.style.color = "#71717a";
              e.currentTarget.style.transform = "rotate(0deg)";
            }}
          >
            <Settings style={{ width: "18px", height: "18px" }} />
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={handleUserClick}
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: user
                  ? "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                  : "linear-gradient(135deg, #71717a 0%, #52525b 100%)",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: user ? "0 0 20px rgba(6, 182, 212, 0.3)" : "0 0 10px rgba(113, 113, 122, 0.2)",
                border: "none",
                transition: "all 0.2s ease",
              }}
            >
              <User style={{ width: "20px", height: "20px", color: "white" }} />
            </button>

            {userMenuOpen && user && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "220px",
                  background: "linear-gradient(135deg, #0a0e1a 0%, #050810 100%)",
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "16px", borderBottom: "1px solid rgba(6, 182, 212, 0.2)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#06b6d4", marginBottom: "4px" }}>
                    {user.username}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#52525b",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {user.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
                    e.currentTarget.style.color = "#06b6d4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <Home style={{ width: "16px", height: "16px" }} />
                  Dashboard
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/admin/users");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(234, 179, 8, 0.1)";
                      e.currentTarget.style.color = "#eab308";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    <Shield style={{ width: "16px", height: "16px" }} />
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setShowPasswordModal(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
                    e.currentTarget.style.color = "#06b6d4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <Lock style={{ width: "16px", height: "16px" }} />
                  Change Password
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut style={{ width: "16px", height: "16px" }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAL CHANGE PASSWORD */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "linear-gradient(135deg, #030712 0%, #000000 100%)",
              border: "1px solid rgba(6, 182, 212, 0.6)",
              borderRadius: "4px",
              padding: "32px",
              boxShadow: "0 0 40px rgba(6, 182, 212, 0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: "0 0 24px 0",
                fontFamily: "monospace",
              }}
            >
              CHANGE PASSWORD
            </h2>

            {passwordError && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(220, 38, 38, 0.2)",
                  border: "1px solid #dc2626",
                  borderRadius: "2px",
                  color: "#dc2626",
                  fontSize: "12px",
                  marginBottom: "24px",
                  fontFamily: "monospace",
                }}
              >
                ⚠️ {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(132, 169, 140, 0.2)",
                  border: "1px solid #84a98c",
                  borderRadius: "2px",
                  color: "#84a98c",
                  fontSize: "12px",
                  marginBottom: "24px",
                  fontFamily: "monospace",
                }}
              >
                ✅ Password changed successfully!
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: "#94a3b8",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    fontFamily: "monospace",
                  }}
                >
                  CURRENT PASSWORD *
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "2px",
                    color: "#e2e8f0",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: "#94a3b8",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    fontFamily: "monospace",
                  }}
                >
                  NEW PASSWORD *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "2px",
                    color: "#e2e8f0",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "28px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "10px",
                    color: "#94a3b8",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                    fontFamily: "monospace",
                  }}
                >
                  CONFIRM NEW PASSWORD *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "2px",
                    color: "#e2e8f0",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess(false);
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "transparent",
                    border: "1px solid #334155",
                    borderRadius: "2px",
                    color: "#94a3b8",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={changingPassword}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: changingPassword
                      ? "#334155"
                      : "linear-gradient(135deg, #eab308 0%, #d97706 100%)",
                    border: changingPassword ? "1px solid #334155" : "1px solid #eab308",
                    borderRadius: "2px",
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    cursor: changingPassword ? "not-allowed" : "pointer",
                    fontFamily: "monospace",
                    boxShadow: changingPassword ? "none" : "0 0 20px rgba(234, 179, 8, 0.4)",
                  }}
                >
                  {changingPassword ? "CHANGING..." : "CHANGE PASSWORD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}