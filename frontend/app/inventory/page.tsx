"use client";

import React, { useState, useEffect } from "react";
import { Package, Users, DollarSign, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = {
  orange: "#d97706",
  orangeLight: "#f59e0b",
  greenOlive: "#84a98c",
  greenOliveLight: "#a3b18a",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  bgLight: "#334155",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
};

interface InventoryItem {
  id: number;
  refinery_id: number;
  refinery_name: string;
  refinery_system: string;
  material_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  estimated_total_value: number;
  last_updated: string;
}

interface UserInventory {
  user_id: number;
  username: string;
  total_estimated_value: number;
  items: InventoryItem[];
}

export default function GlobalInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usersInventory, setUsersInventory] = useState<UserInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadInventory();
  }, [router]);

  async function loadInventory() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/production/inventory/global`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        alert("Access denied: Officer or Admin privileges required");
        router.push("/");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsersInventory(data);
        // Expand all users by default
        setExpandedUsers(new Set(data.map((u: UserInventory) => u.user_id)));
      }
    } catch (e) {
      console.error("Failed to load global inventory:", e);
    } finally {
      setLoading(false);
    }
  }

  const toggleUser = (userId: number) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredInventory = usersInventory
    .map((user) => ({
      ...user,
      items: user.items.filter(
        (item) =>
          item.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((user) => user.items.length > 0);

  const totalGlobalValue = usersInventory.reduce(
    (sum, user) => sum + user.total_estimated_value,
    0
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: COLORS.bgDark,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: `4px solid ${COLORS.orange}40`,
              borderTopColor: COLORS.orange,
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          <div
            style={{
              color: COLORS.orange,
              fontSize: "14px",
              letterSpacing: "2px",
              fontWeight: 600,
            }}
          >
            LOADING GLOBAL INVENTORY...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bgDark,
        padding: "32px",
      }}
    >
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: `${COLORS.orange}20`,
              border: `2px solid ${COLORS.orange}`,
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Package style={{ width: "28px", height: "28px", color: COLORS.orange }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: COLORS.textPrimary,
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              GLOBAL INVENTORY
            </h1>
            <div
              style={{
                fontSize: "12px",
                color: COLORS.textSecondary,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              // CORPORATION-WIDE MANIFEST
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              background: COLORS.bgMedium,
              border: `1px solid ${COLORS.bgLight}`,
              borderRadius: "4px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: COLORS.textSecondary,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              TOTAL USERS
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: COLORS.orange,
              }}
            >
              {usersInventory.length}
            </div>
          </div>

          <div
            style={{
              background: COLORS.bgMedium,
              border: `1px solid ${COLORS.bgLight}`,
              borderRadius: "4px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: COLORS.textSecondary,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              TOTAL ITEMS
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: COLORS.orange,
              }}
            >
              {usersInventory.reduce((sum, u) => sum + u.items.length, 0)}
            </div>
          </div>

          <div
            style={{
              background: COLORS.bgMedium,
              border: `1px solid ${COLORS.greenOlive}40`,
              borderRadius: "4px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: COLORS.textSecondary,
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              TOTAL VALUE
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: COLORS.greenOlive,
              }}
            >
              {totalGlobalValue.toLocaleString()} aUEC
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ marginTop: "24px" }}>
          <input
            type="text"
            placeholder="Search by user or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: COLORS.bgMedium,
              border: `1px solid ${COLORS.bgLight}`,
              borderRadius: "4px",
              color: COLORS.textPrimary,
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = COLORS.orange)}
            onBlur={(e) => (e.target.style.borderColor = COLORS.bgLight)}
          />
        </div>
      </div>

      {/* USERS INVENTORY */}
      {filteredInventory.length === 0 ? (
        <div
          style={{
            padding: "64px",
            textAlign: "center",
            background: COLORS.bgMedium,
            border: `1px solid ${COLORS.bgLight}`,
            borderRadius: "4px",
          }}
        >
          <Package
            style={{
              width: "48px",
              height: "48px",
              color: COLORS.textTertiary,
              margin: "0 auto 16px",
            }}
          />
          <div
            style={{
              fontSize: "16px",
              color: COLORS.textSecondary,
              marginBottom: "8px",
            }}
          >
            No inventory found
          </div>
          <div style={{ fontSize: "13px", color: COLORS.textTertiary }}>
            {searchTerm ? "Try adjusting your search" : "No users have inventory yet"}
          </div>
        </div>
      ) : (
        filteredInventory.map((user) => (
          <div
            key={user.user_id}
            style={{
              background: COLORS.bgMedium,
              border: `1px solid ${COLORS.bgLight}`,
              borderRadius: "4px",
              marginBottom: "16px",
              overflow: "hidden",
            }}
          >
            {/* USER HEADER */}
            <button
              onClick={() => toggleUser(user.user_id)}
              style={{
                width: "100%",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${COLORS.orange}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Users
                  style={{
                    width: "20px",
                    height: "20px",
                    color: COLORS.orange,
                  }}
                />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      letterSpacing: "1px",
                    }}
                  >
                    {user.username}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: COLORS.textSecondary,
                      marginTop: "4px",
                    }}
                  >
                    {user.items.length} items • {user.total_estimated_value.toLocaleString()}{" "}
                    aUEC
                  </div>
                </div>
              </div>

              {expandedUsers.has(user.user_id) ? (
                <ChevronUp style={{ width: "20px", height: "20px", color: COLORS.orange }} />
              ) : (
                <ChevronDown style={{ width: "20px", height: "20px", color: COLORS.orange }} />
              )}
            </button>

            {/* USER INVENTORY TABLE */}
            {expandedUsers.has(user.user_id) && (
              <div
                style={{
                  borderTop: `1px solid ${COLORS.bgLight}`,
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: COLORS.bgLight }}>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "left",
                          fontSize: "11px",
                          color: COLORS.textSecondary,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        MATERIAL
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "right",
                          fontSize: "11px",
                          color: COLORS.textSecondary,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        QUANTITY
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "right",
                          fontSize: "11px",
                          color: COLORS.textSecondary,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        UNIT PRICE
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "right",
                          fontSize: "11px",
                          color: COLORS.textSecondary,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        TOTAL VALUE
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "left",
                          fontSize: "11px",
                          color: COLORS.textSecondary,
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        SOURCE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.items.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: `1px solid ${COLORS.bgLight}40`,
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 20px",
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                          }}
                        >
                          {item.material_name}
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            textAlign: "right",
                            color: COLORS.textPrimary,
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            textAlign: "right",
                            color: COLORS.textSecondary,
                            fontSize: "13px",
                          }}
                        >
                          {item.estimated_unit_price.toLocaleString()} aUEC
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            textAlign: "right",
                            color: COLORS.greenOlive,
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {item.estimated_total_value.toLocaleString()} aUEC
                        </td>
                        <td
                          style={{
                            padding: "12px 20px",
                            color: COLORS.textTertiary,
                            fontSize: "12px",
                          }}
                        >
                          {item.refinery_name} • {item.refinery_system}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}