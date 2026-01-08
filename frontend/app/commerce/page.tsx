"use client";

import CargoRunsTracker from "./CargoRunsTracker";
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  DollarSign,
  ArrowRight,
  Calculator,
  Truck,
  BarChart3,
  MapPin,
  Clock,
  Percent,
  Zap,
  ChevronDown,
  Plus,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// ============================================================
// COULEURS COMMERCE (Cyan électrique Star Citizen)
// ============================================================
const COLORS = {
  cyan: "#22d3ee",
  cyanDark: "#0891b2",
  cyanLight: "#67e8f9",
  profit: "#10b981",
  profitLight: "#34d399",
  loss: "#ef4444",
  lossLight: "#f87171",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  bgLight: "#334155",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  warning: "#f59e0b",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ============================================================
// INTERFACES
// ============================================================

interface Commodity {
  id: number;
  name: string;
  code: string;
  type: string;
}

interface Location {
  id: number;
  name: string;
  system: string;
  type: string;
}

interface CargoRun {
  id: number;
  commodity_name: string;
  buy_location: string;
  sell_location: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  total_investment: number;
  expected_profit: number;
  status: "active" | "delivered" | "cancelled";
  created_at: string;
  delivered_at?: string;
}

// ============================================================
// UTILITY
// ============================================================

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return formatNumber(num);
}

// ============================================================
// COMPOSANT: Floating Particles
// ============================================================

function FloatingParticles() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden'
    }}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            background: COLORS.cyan,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.2,
            animation: `float ${10 + Math.random() * 20}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`,
            boxShadow: `0 0 ${Math.random() * 10 + 5}px ${COLORS.cyan}`
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// COMPOSANT: Scan Line
// ============================================================

function ScanLine() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '2px',
      background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
      animation: 'scanVertical 8s linear infinite',
      zIndex: 1,
      pointerEvents: 'none',
      boxShadow: `0 0 20px ${COLORS.cyan}`
    }} />
  );
}

// ============================================================
// COMPOSANT: Trade Calculator
// ============================================================

function TradeCalculator() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCommodity, setSelectedCommodity] = useState<number>(0);
  const [buyLocation, setBuyLocation] = useState<string>("");
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellLocation, setSellLocation] = useState<string>("");
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [cargoCapacity, setCargoCapacity] = useState<number>(0);

  // Calculated values
  const profitPerUnit = sellPrice - buyPrice;
  const totalProfit = profitPerUnit * cargoCapacity;
  const totalInvestment = buyPrice * cargoCapacity;
  const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100) : 0;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // ✅ Change l'endpoint
      const res = await fetch(`${API_URL}/market/commodities`);
      const data = await res.json();

      // ✅ Ajoute protection
      const validData = Array.isArray(data) ? data : [];
      setCommodities(validData.filter((c: Commodity) =>
        !c.name.includes('(Raw)') && !c.name.includes('(Ore)')
      ));
      setLoading(false);
    } catch (e) {
      console.error("Error loading trade data:", e);
      setLoading(false);
    }
  }

  const reset = () => {
    setSelectedCommodity(0);
    setBuyLocation("");
    setBuyPrice(0);
    setSellLocation("");
    setSellPrice(0);
    setCargoCapacity(0);
  };

  if (loading) {
    return (
      <div style={{
        padding: '80px',
        textAlign: 'center',
        background: `${COLORS.bgMedium}80`,
        border: `1px solid ${COLORS.cyan}40`,
        borderRadius: '4px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${COLORS.cyan}40`,
          borderTopColor: COLORS.cyan,
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: COLORS.cyan,
          fontSize: '12px',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          textTransform: 'uppercase'
        }}>
          LOADING TRADE DATA...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 400px 1fr',
      gap: '32px',
      alignItems: 'start'
    }}>
      {/* LEFT PANEL - BUY */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
        border: `1px solid ${COLORS.cyan}60`,
        borderRadius: '4px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${COLORS.loss}, transparent)`
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `${COLORS.loss}20`,
            border: `1px solid ${COLORS.loss}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package style={{ width: '20px', height: '20px', color: COLORS.loss }} />
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              BUY POINT
            </div>
            <div style={{
              fontSize: '10px',
              color: COLORS.textTertiary,
              letterSpacing: '1px',
              fontFamily: 'monospace'
            }}>
              // SOURCE LOCATION
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              COMMODITY
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.textPrimary,
                fontSize: '13px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            >
              <option value={0}>Select commodity...</option>
              {commodities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              LOCATION
            </label>
            <input
              type="text"
              value={buyLocation}
              onChange={(e) => setBuyLocation(e.target.value)}
              placeholder="e.g. Port Olisar, Lorville..."
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.textPrimary,
                fontSize: '13px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              BUY PRICE (aUEC/UNIT)
            </label>
            <input
              type="number"
              value={buyPrice || ''}
              onChange={(e) => setBuyPrice(Number(e.target.value))}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.loss,
                fontSize: '18px',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            />
          </div>
        </div>
      </div>

      {/* CENTER PANEL - RESULTS */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `1px solid ${COLORS.cyan}60`,
          borderRadius: '4px',
          padding: '20px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${COLORS.cyan}, transparent)`
          }} />

          <label style={{
            display: 'block',
            fontSize: '10px',
            color: COLORS.textSecondary,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            fontFamily: 'monospace'
          }}>
            CARGO CAPACITY (SCU)
          </label>
          <input
            type="number"
            value={cargoCapacity || ''}
            onChange={(e) => setCargoCapacity(Number(e.target.value))}
            placeholder="0"
            min="0"
            style={{
              width: '100%',
              padding: '16px',
              background: COLORS.bgDark,
              border: `2px solid ${COLORS.cyan}60`,
              borderRadius: '2px',
              color: COLORS.cyan,
              fontSize: '32px',
              fontFamily: 'monospace',
              fontWeight: 700,
              textAlign: 'center',
              outline: 'none',
              boxShadow: `0 0 20px ${COLORS.cyan}20`,
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.cyan;
              e.target.style.boxShadow = `0 0 30px ${COLORS.cyan}40`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = `${COLORS.cyan}60`;
              e.target.style.boxShadow = `0 0 20px ${COLORS.cyan}20`;
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px 0'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: `${COLORS.cyan}20`,
            border: `2px solid ${COLORS.cyan}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${COLORS.cyan}40`,
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <ArrowRight style={{ width: '32px', height: '32px', color: COLORS.cyan }} />
          </div>
        </div>

        <div style={{
          background: profitPerUnit >= 0
            ? `linear-gradient(135deg, ${COLORS.profit}15 0%, ${COLORS.bgMedium}f8 100%)`
            : `linear-gradient(135deg, ${COLORS.loss}15 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `2px solid ${profitPerUnit >= 0 ? COLORS.profit : COLORS.loss}`,
          borderRadius: '4px',
          padding: '24px',
          position: 'relative',
          boxShadow: `0 0 40px ${profitPerUnit >= 0 ? COLORS.profit : COLORS.loss}20`
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${profitPerUnit >= 0 ? COLORS.profit : COLORS.loss}, transparent)`
          }} />

          <div style={{
            fontSize: '10px',
            color: COLORS.textSecondary,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}>
            // TOTAL PROFIT
          </div>

          <div style={{
            fontSize: '48px',
            fontWeight: 700,
            color: profitPerUnit >= 0 ? COLORS.profit : COLORS.loss,
            fontFamily: 'monospace',
            textAlign: 'center',
            marginBottom: '16px',
            textShadow: `0 0 20px ${profitPerUnit >= 0 ? COLORS.profit : COLORS.loss}60`,
            animation: totalProfit !== 0 ? 'glow 2s ease-in-out infinite' : 'none'
          }}>
            {profitPerUnit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            paddingTop: '16px',
            borderTop: `1px solid ${profitPerUnit >= 0 ? COLORS.profit : COLORS.loss}40`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '9px',
                color: COLORS.textTertiary,
                letterSpacing: '1px',
                marginBottom: '4px',
                fontFamily: 'monospace'
              }}>
                PER UNIT
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: profitPerUnit >= 0 ? COLORS.profitLight : COLORS.lossLight,
                fontFamily: 'monospace'
              }}>
                {profitPerUnit >= 0 ? '+' : ''}{formatNumber(profitPerUnit)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '9px',
                color: COLORS.textTertiary,
                letterSpacing: '1px',
                marginBottom: '4px',
                fontFamily: 'monospace'
              }}>
                ROI
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: profitPerUnit >= 0 ? COLORS.profitLight : COLORS.lossLight,
                fontFamily: 'monospace'
              }}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={reset}
          style={{
            padding: '12px',
            background: COLORS.bgLight,
            border: `1px solid ${COLORS.textTertiary}`,
            borderRadius: '2px',
            color: COLORS.textSecondary,
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'monospace',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.bgMedium;
            e.currentTarget.style.color = COLORS.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = COLORS.bgLight;
            e.currentTarget.style.color = COLORS.textSecondary;
          }}
        >
          RESET CALCULATOR
        </button>
      </div>

      {/* RIGHT PANEL - SELL */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
        border: `1px solid ${COLORS.cyan}60`,
        borderRadius: '4px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${COLORS.profit}, transparent)`
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `${COLORS.profit}20`,
            border: `1px solid ${COLORS.profit}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DollarSign style={{ width: '20px', height: '20px', color: COLORS.profit }} />
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              SELL POINT
            </div>
            <div style={{
              fontSize: '10px',
              color: COLORS.textTertiary,
              letterSpacing: '1px',
              fontFamily: 'monospace'
            }}>
              // DESTINATION LOCATION
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              LOCATION
            </label>
            <input
              type="text"
              value={sellLocation}
              onChange={(e) => setSellLocation(e.target.value)}
              placeholder="e.g. Area18, New Babbage..."
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.textPrimary,
                fontSize: '13px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              SELL PRICE (aUEC/UNIT)
            </label>
            <input
              type="number"
              value={sellPrice || ''}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.profit,
                fontSize: '18px',
                fontFamily: 'monospace',
                fontWeight: 700,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            />
          </div>

          <div style={{
            padding: '16px',
            background: `${COLORS.warning}10`,
            border: `1px solid ${COLORS.warning}40`,
            borderRadius: '2px',
            marginTop: '20px'
          }}>
            <div style={{
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              INVESTMENT REQUIRED
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.warning,
              fontFamily: 'monospace'
            }}>
              {formatCurrency(totalInvestment)} aUEC
            </div>
            <div style={{
              fontSize: '10px',
              color: COLORS.textTertiary,
              marginTop: '4px',
              fontFamily: 'monospace'
            }}>
              {formatNumber(totalInvestment)} aUEC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT: Trade Stats (SIMPLIFIÉ)
// ============================================================

function TradeStats() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '80px',
        textAlign: 'center',
        background: `${COLORS.bgMedium}80`,
        border: `1px solid ${COLORS.cyan}40`,
        borderRadius: '4px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${COLORS.cyan}40`,
          borderTopColor: COLORS.cyan,
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: COLORS.cyan,
          fontSize: '12px',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          textTransform: 'uppercase'
        }}>
          LOADING TRADE STATS...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '60px',
      textAlign: 'center',
      background: `${COLORS.cyan}05`,
      border: `2px dashed ${COLORS.cyan}40`,
      borderRadius: '4px'
    }}>
      <BarChart3 style={{
        width: '64px',
        height: '64px',
        color: COLORS.cyan,
        margin: '0 auto 24px',
        opacity: 0.6
      }} />
      <div style={{
        fontSize: '20px',
        fontWeight: 700,
        color: COLORS.cyan,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
        marginBottom: '12px'
      }}>
        TRADE STATISTICS
      </div>
      <div style={{
        fontSize: '13px',
        color: COLORS.textSecondary,
        letterSpacing: '1px',
        fontFamily: 'monospace',
        lineHeight: 1.6
      }}>
        // MODULE COMING SOON<br />
        View top commodities, best routes, profit graphs<br />
        Full analytics dashboard in development
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function CommercePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"calculator" | "runs" | "stats">("calculator");
  const [mounted, setMounted] = useState(false);

  // ✅ PROTECTION AUTH
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: `4px solid ${COLORS.cyan}40`,
          borderTopColor: COLORS.cyan,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: COLORS.cyan,
          fontSize: '14px',
          letterSpacing: '3px',
          fontWeight: 600,
          fontFamily: 'monospace'
        }}>
          INITIALIZING COMMERCE MODULE...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bgDark,
      color: COLORS.textPrimary,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <FloatingParticles />
      <ScanLine />

      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '32px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* HEADER */}
        <div style={{
          marginBottom: '40px',
          position: 'relative',
          paddingBottom: '20px'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '4px',
            height: '100%',
            background: `linear-gradient(180deg, ${COLORS.cyan} 0%, transparent 100%)`
          }} />

          <div style={{ paddingLeft: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: `${COLORS.cyan}20`,
                border: `2px solid ${COLORS.cyan}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 30px ${COLORS.cyan}40`
              }}>
                <TrendingUp style={{ width: '28px', height: '28px', color: COLORS.cyan }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '42px',
                  fontWeight: 700,
                  color: COLORS.cyan,
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  margin: 0,
                  fontFamily: 'monospace',
                  textShadow: `0 0 30px ${COLORS.cyan}60`
                }}>
                  COMMERCE
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: COLORS.textSecondary,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  marginTop: '4px'
                }}>
                  // TRADE MANAGEMENT SYSTEM
                </div>
              </div>
            </div>
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, ${COLORS.cyan} 0%, transparent 50%, ${COLORS.cyan} 100%)`,
            opacity: 0.3
          }} />
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: `1px solid ${COLORS.bgLight}`,
          paddingBottom: '0'
        }}>
          {[
            { key: "calculator" as const, label: "TRADE CALCULATOR", icon: Calculator },
            { key: "runs" as const, label: "CARGO RUNS", icon: Truck },
            { key: "stats" as const, label: "STATISTICS", icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.key
                  ? `linear-gradient(135deg, ${COLORS.cyan}20 0%, ${COLORS.cyan}10 100%)`
                  : 'transparent',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.key ? COLORS.cyan : 'transparent'}`,
                borderRadius: '4px 4px 0 0',
                color: activeTab === tab.key ? COLORS.cyan : COLORS.textSecondary,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.key ? `0 0 20px ${COLORS.cyan}20` : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = COLORS.textPrimary;
                  e.currentTarget.style.background = `${COLORS.bgLight}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.color = COLORS.textSecondary;
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <tab.icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{
          background: `${COLORS.bgMedium}40`,
          border: `1px solid ${COLORS.cyan}20`,
          borderRadius: '4px',
          padding: '32px',
          minHeight: '600px'
        }}>
          {activeTab === "calculator" && <TradeCalculator />}
          {activeTab === "runs" && <CargoRunsTracker />}
          {activeTab === "stats" && <TradeStats />}
        </div>
      </div>

      {/* STYLES */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        
        @keyframes float {
          0% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-10px); }
          75% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        
        @keyframes scanVertical {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px currentColor; }
          50% { text-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
        }
      `}</style>
    </div>
  );
}