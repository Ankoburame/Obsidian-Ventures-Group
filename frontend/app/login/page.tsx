"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, LogIn } from "lucide-react";

const COLORS = {
  orange: "#d97706",
  red: "#dc2626",
  yellow: "#eab308",
  greenOlive: "#84a98c",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  bgLight: "#334155",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  cyan: "#22d3ee",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Créer le body en format form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Appel API
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();

      // Stocker le token
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("user-login"));

      // Rediriger vers le dashboard
      router.push("/");

    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, #030712 0%, #000000 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background effects */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "450px",
        background: `linear-gradient(135deg, ${COLORS.bgMedium} 0%, ${COLORS.bgDark} 100%)`,
        border: `1px solid ${COLORS.cyan}60`,
        borderRadius: "8px",
        padding: "48px",
        boxShadow: `0 0 40px ${COLORS.cyan}30`,
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header avec Logo OVG */}
        <div style={{
          textAlign: "center",
          marginBottom: "48px"
        }}>
          {/* Logo OVG */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
            filter: "drop-shadow(0 0 30px rgba(6, 182, 212, 0.6))",
          }}>
            <Image
              src="/images/logo/ovg_logo_main.svg"
              alt="Obsidian Ventures Group"
              width={120}
              height={120}
              priority
            />
          </div>

          {/* Nom de la corpo */}
          <h1 style={{
            fontSize: "28px",
            fontWeight: 700,
            color: COLORS.cyan,
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: "0 0 8px 0",
            textShadow: `0 0 20px ${COLORS.cyan}60`,
          }}>
            OBSIDIAN
          </h1>
          <div style={{
            fontSize: "16px",
            color: COLORS.textSecondary,
            letterSpacing: "2px",
            marginBottom: "12px",
          }}>
            VENTURES GROUP
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: "12px",
            color: COLORS.cyan,
            letterSpacing: "2px",
            fontStyle: "italic",
            opacity: 0.8,
          }}>
            Precision. Power. Profit.
          </div>

          {/* Separator */}
          <div style={{
            width: "80px",
            height: "1px",
            background: `linear-gradient(90deg, transparent 0%, ${COLORS.cyan} 50%, transparent 100%)`,
            margin: "24px auto 0",
            opacity: 0.5,
          }} />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px",
            background: `${COLORS.red}20`,
            border: `1px solid ${COLORS.red}`,
            borderRadius: "4px",
            color: COLORS.red,
            fontSize: "12px",
            marginBottom: "24px",
            fontFamily: "monospace"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Username */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: COLORS.textSecondary,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: "monospace"
            }}>
              USERNAME
            </label>
            <div style={{ position: "relative" }}>
              <User style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: COLORS.textSecondary
              }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: "4px",
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              color: COLORS.textSecondary,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: "monospace"
            }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <Lock style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "16px",
                height: "16px",
                color: COLORS.textSecondary
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: "4px",
                  color: COLORS.textPrimary,
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading
                ? COLORS.bgLight
                : `linear-gradient(135deg, ${COLORS.cyan} 0%, #06b6d4 100%)`,
              border: `1px solid ${loading ? COLORS.bgLight : COLORS.cyan}`,
              borderRadius: "4px",
              color: loading ? COLORS.textSecondary : "#0a0e14",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: loading ? "none" : `0 0 30px ${COLORS.cyan}50`,
              transition: "all 0.2s ease"
            }}
          >
            <LogIn style={{ width: "16px", height: "16px" }} />
            {loading ? "AUTHENTICATING..." : "ACCESS SYSTEM"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: `1px solid ${COLORS.bgLight}`,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "10px",
            color: COLORS.textSecondary,
            letterSpacing: "1px",
            lineHeight: 1.6,
          }}>
            AUTHORIZED PERSONNEL ONLY
            <br />
            RESOURCE MANAGEMENT SYSTEM v0.1.0
          </div>
        </div>
      </div>
    </div>
  );
}