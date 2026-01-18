"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Factory,
  ShoppingCart,
  TrendingUp,
  BookOpen,
  Zap,
  Map,
  Hammer,
  TrendingUp as TrendingUpAlt,
  Circle,
  ChevronRight,
  ChevronDown,
  Lock,
  BarChart3,
  Clock,
  PieChart,
  Users,
  Ship,
} from "lucide-react";

  type SidebarProps = {
    open: boolean;
    toggleSidebar: () => void;
  };

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/commerce", label: "Commerce", icon: ShoppingCart },
  { href: "/fleet", label: "Fleet", icon: Ship },
  { href: "/market", label: "Market", icon: TrendingUp },
];

const referenceItems = [
  { href: "/reference/refining", label: "Refining", icon: Zap, available: true },
  { href: "/reference/maps", label: "Stellar Maps", icon: Map, available: false },
  { href: "/reference/mining-spots", label: "Mining Spots", icon: Hammer, available: true },
  { href: "/reference/trade", label: "Trade Routes", icon: TrendingUpAlt, available: false },
];

const statsItems = [
  { href: "/stats/history", label: "Historique", icon: Clock, available: true },
  { href: "/stats/analytics", label: "Analytics", icon: PieChart, available: false },
  { href: "/stats/crew", label: "Crew Payout", icon: Users, available: true }, // ✅ UNLOCKED
];

export function Sidebar({ open, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const [referenceOpen, setReferenceOpen] = useState(pathname.startsWith("/reference"));
  const [statsOpen, setStatsOpen] = useState(pathname.startsWith("/stats"));

  const isReferenceActive = pathname.startsWith("/reference");
  const isStatsActive = pathname.startsWith("/stats");

  return (
    <aside
      style={{
        width: open ? "280px" : "80px",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background: "linear-gradient(180deg, #0a0e1a 0%, #050810 100%)",
        borderRight: "1px solid rgba(6, 182, 212, 0.1)",
        display: "flex",
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Ligne lumineuse à droite */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "1px",
          background: "linear-gradient(180deg, transparent 0%, #06b6d4 50%, transparent 100%)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />

      {/* TOGGLE RIBBON - Full Height OUTSIDE */}
      <div
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          right: "-24px",
          top: 0,
          bottom: 0,
          width: "24px",
          background: "linear-gradient(180deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)",
          borderRight: "1px solid rgba(6, 182, 212, 0.3)",
          borderLeft: "1px solid rgba(6, 182, 212, 0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          zIndex: 10,
          borderRadius: "0 8px 8px 0",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(180deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.12) 100%)";
          e.currentTarget.style.borderRightColor = "rgba(6, 182, 212, 0.6)";
          e.currentTarget.style.width = "28px";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(6, 182, 212, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(180deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)";
          e.currentTarget.style.borderRightColor = "rgba(6, 182, 212, 0.3)";
          e.currentTarget.style.width = "24px";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <ChevronRight
          style={{
            width: "16px",
            height: "16px",
            color: "#06b6d4",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            filter: "drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))",
          }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <div
          style={{
            height: "72px",
            display: "flex",
            alignItems: "center",
            padding: open ? "0 24px 0 20px" : "0 20px",
            borderBottom: "1px solid rgba(6, 182, 212, 0.1)",
            position: "relative",
          }}
        >
          {open ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.6))",
                }}
              >
                <Image
                  src="/images/logo/ovg_icon_only.svg"
                  alt="OVG Logo"
                  width={40}
                  height={40}
                  priority
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#22d3ee",
                    letterSpacing: "2px",
                  }}
                >
                  OBSIDIAN
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#52525b",
                    letterSpacing: "1px",
                  }}
                >
                  VENTURES GROUP
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.6))",
              }}
            >
              <Image
                src="/images/logo/ovg_icon_only.svg"
                alt="OVG"
                width={40}
                height={40}
                priority
              />
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <nav
          style={{
            flex: 1,
            padding: "24px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Main nav items */}
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: open ? "16px 20px" : "16px 0",
                  justifyContent: open ? "flex-start" : "center",
                  borderRadius: "8px",
                  background: active
                    ? "linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(6, 182, 212, 0.3)"
                    : "1px solid transparent",
                  color: active ? "#06b6d4" : "#71717a",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                    e.currentTarget.style.color = "#a1a1aa";
                    e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#71717a";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "60%",
                      background: "#06b6d4",
                      borderRadius: "0 2px 2px 0",
                      boxShadow: "0 0 10px #06b6d4",
                    }}
                  />
                )}

                <Icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />

                {open && (
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: active ? 600 : 500,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Reference Section */}
          <div style={{ marginTop: "24px" }}>
            <button
              onClick={() => setReferenceOpen(!referenceOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: open ? "16px 20px" : "16px 0",
                justifyContent: open ? "flex-start" : "center",
                borderRadius: "8px",
                background: isReferenceActive
                  ? "linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)"
                  : "transparent",
                border: isReferenceActive
                  ? "1px solid rgba(6, 182, 212, 0.3)"
                  : "1px solid transparent",
                color: isReferenceActive ? "#06b6d4" : "#71717a",
                transition: "all 0.2s ease",
                position: "relative",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isReferenceActive) {
                  e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                  e.currentTarget.style.color = "#a1a1aa";
                  e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isReferenceActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#71717a";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              {isReferenceActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "60%",
                    background: "#06b6d4",
                    borderRadius: "0 2px 2px 0",
                    boxShadow: "0 0 10px #06b6d4",
                  }}
                />
              )}

              <BookOpen style={{ width: "20px", height: "20px", flexShrink: 0 }} />

              {open && (
                <>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: isReferenceActive ? 600 : 500,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                  >
                    Reference
                  </span>
                  {referenceOpen ? (
                    <ChevronDown style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <ChevronRight style={{ width: "16px", height: "16px" }} />
                  )}
                </>
              )}
            </button>

            {/* Submenu items */}
            {open && referenceOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  marginTop: "4px",
                  marginLeft: "12px",
                  paddingLeft: "24px",
                  borderLeft: "2px solid rgba(6, 182, 212, 0.2)",
                }}
              >
                {referenceItems.map(({ href, label, icon: Icon, available }) => {
                  const active = pathname === href;

                  if (!available) {
                    return (
                      <div
                        key={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "6px",
                          color: "#3f3f46",
                          fontSize: "13px",
                          cursor: "not-allowed",
                          opacity: 0.5,
                        }}
                      >
                        <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{label}</span>
                        <Lock style={{ width: "12px", height: "12px" }} />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        background: active
                          ? "rgba(6, 182, 212, 0.1)"
                          : "transparent",
                        color: active ? "#06b6d4" : "#71717a",
                        fontSize: "13px",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                          e.currentTarget.style.color = "#a1a1aa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#71717a";
                        }
                      }}
                    >
                      <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                      <span>{label}</span>
                      {active && (
                        <div
                          style={{
                            marginLeft: "auto",
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: "#06b6d4",
                            boxShadow: "0 0 6px #06b6d4",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div style={{ marginTop: "8px" }}>
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: open ? "16px 20px" : "16px 0",
                justifyContent: open ? "flex-start" : "center",
                borderRadius: "8px",
                background: isStatsActive
                  ? "linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)"
                  : "transparent",
                border: isStatsActive
                  ? "1px solid rgba(6, 182, 212, 0.3)"
                  : "1px solid transparent",
                color: isStatsActive ? "#06b6d4" : "#71717a",
                transition: "all 0.2s ease",
                position: "relative",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isStatsActive) {
                  e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                  e.currentTarget.style.color = "#a1a1aa";
                  e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isStatsActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#71717a";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              {isStatsActive && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "3px",
                    height: "60%",
                    background: "#06b6d4",
                    borderRadius: "0 2px 2px 0",
                    boxShadow: "0 0 10px #06b6d4",
                  }}
                />
              )}

              <BarChart3 style={{ width: "20px", height: "20px", flexShrink: 0 }} />

              {open && (
                <>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: isStatsActive ? 600 : 500,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                  >
                    Stats
                  </span>
                  {statsOpen ? (
                    <ChevronDown style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <ChevronRight style={{ width: "16px", height: "16px" }} />
                  )}
                </>
              )}
            </button>

            {/* Submenu items */}
            {open && statsOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  marginTop: "4px",
                  marginLeft: "12px",
                  paddingLeft: "24px",
                  borderLeft: "2px solid rgba(6, 182, 212, 0.2)",
                }}
              >
                {statsItems.map(({ href, label, icon: Icon, available }) => {
                  const active = pathname === href;

                  if (!available) {
                    return (
                      <div
                        key={href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "6px",
                          color: "#3f3f46",
                          fontSize: "13px",
                          cursor: "not-allowed",
                          opacity: 0.5,
                        }}
                      >
                        <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{label}</span>
                        <Lock style={{ width: "12px", height: "12px" }} />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      href={href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        background: active
                          ? "rgba(6, 182, 212, 0.1)"
                          : "transparent",
                        color: active ? "#06b6d4" : "#71717a",
                        fontSize: "13px",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                          e.currentTarget.style.color = "#a1a1aa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#71717a";
                        }
                      }}
                    >
                      <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                      <span>{label}</span>
                      {active && (
                        <div
                          style={{
                            marginLeft: "auto",
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: "#06b6d4",
                            boxShadow: "0 0 6px #06b6d4",
                          }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* FOOTER - STATUS */}
        <div
          style={{
            padding: open ? "20px 24px 20px 20px" : "20px 12px",
            borderTop: "1px solid rgba(6, 182, 212, 0.1)",
          }}
        >
          {open ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Circle
                  style={{
                    width: "8px",
                    height: "8px",
                    fill: "#10b981",
                    color: "#10b981",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#71717a",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  API Connected
                </span>
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#3f3f46",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                }}
              >
                v0.1.0-alpha
              </div>

              <div
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent 0%, #06b6d4 50%, transparent 100%)",
                  opacity: 0.3,
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <Circle
                style={{
                  width: "8px",
                  height: "8px",
                  fill: "#10b981",
                  color: "#10b981",
                  margin: "0 auto",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}