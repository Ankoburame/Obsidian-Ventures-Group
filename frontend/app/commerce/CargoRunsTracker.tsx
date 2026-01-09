// ============================================================
// COMPOSANT COMPLET: Cargo Runs Tracker
// Version finale connectée à l'API
// ============================================================

import React, { useState, useEffect } from "react";
import { Truck, Plus, CheckCircle, XCircle, Clock, Loader } from "lucide-react";

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
  notes?: string;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

function formatCurrency(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return formatNumber(num);
}

export default function CargoRunsTracker() {
  const [runs, setRuns] = useState<CargoRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [commodityName, setCommodityName] = useState("");
  const [buyLocation, setBuyLocation] = useState("");
  const [sellLocation, setSellLocation] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadRuns();
    const timer = setInterval(loadRuns, 5000);
    return () => clearInterval(timer);
  }, []);

  async function loadRuns() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/cargo/runs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch runs");
      const data = await res.json();
      setRuns(data);
      setLoading(false);
    } catch (e) {
      console.error("Error loading cargo runs:", e);
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!commodityName || !buyLocation || !sellLocation || quantity <= 0 || buyPrice <= 0 || sellPrice <= 0) {
      alert("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        commodity_name: commodityName,
        buy_location: buyLocation,
        sell_location: sellLocation,
        quantity,
        buy_price: buyPrice,
        sell_price: sellPrice,
        notes: notes || undefined
      };

      const res = await fetch(`${API_URL}/corgo/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create run");

      // Reset form
      setCommodityName("");
      setBuyLocation("");
      setSellLocation("");
      setQuantity(0);
      setBuyPrice(0);
      setSellPrice(0);
      setNotes("");
      setIsFormOpen(false);

      loadRuns();
    } catch (e: any) {
      console.error("Error creating run:", e);
      alert("Failed to create cargo run: " + e.message);
    }

    setSubmitting(false);
  }

  async function handleDeliver(id: number) {
    try {
      const res = await fetch(`${API_URL}/cargo/runs/${id}/deliver`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("Failed to deliver");
      loadRuns();
    } catch (e) {
      console.error("Error delivering run:", e);
      alert("Failed to mark as delivered");
    }
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancel this cargo run?")) return;

    try {
      const res = await fetch(`${API_URL}/cargo/runs/${id}/cancel`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error("Failed to cancel");
      loadRuns();
    } catch (e) {
      console.error("Error canceling run:", e);
      alert("Failed to cancel run");
    }
  }

  const activeRuns = runs.filter(r => r.status === "active");
  const deliveredRuns = runs.filter(r => r.status === "delivered");

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
          LOADING CARGO RUNS...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* NEW RUN BUTTON */}
      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: isFormOpen
            ? `linear-gradient(135deg, ${COLORS.cyan}30 0%, ${COLORS.cyan}20 100%)`
            : `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
          border: `1px solid ${isFormOpen ? COLORS.cyan : COLORS.bgLight}`,
          borderRadius: '4px',
          color: isFormOpen ? COLORS.cyan : COLORS.textPrimary,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'monospace',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          boxShadow: isFormOpen ? `0 0 20px ${COLORS.cyan}30` : 'none',
          marginBottom: '32px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Truck style={{ width: '16px', height: '16px' }} />
          NEW CARGO RUN
        </span>
        <Plus style={{ width: '20px', height: '20px' }} />
      </button>

      {/* FORM */}
      <div style={{
        maxHeight: isFormOpen ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s ease-in-out',
        marginBottom: isFormOpen ? '40px' : '0'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `1px solid ${COLORS.cyan}60`,
          borderRadius: '4px',
          padding: '24px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${COLORS.cyan}, transparent)`
          }} />

          <div style={{
            fontSize: '11px',
            color: COLORS.cyan,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '24px',
            fontFamily: 'monospace'
          }}>
            // NEW CARGO RUN :: CONFIGURATION
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Commodity */}
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
                COMMODITY *
              </label>
              <input
                type="text"
                value={commodityName}
                onChange={(e) => setCommodityName(e.target.value)}
                placeholder="e.g. Medical Supplies, Scrap..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>

            {/* Quantity */}
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
                QUANTITY (SCU) *
              </label>
              <input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.cyan,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>

            {/* Buy Location */}
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
                BUY LOCATION *
              </label>
              <input
                type="text"
                value={buyLocation}
                onChange={(e) => setBuyLocation(e.target.value)}
                placeholder="e.g. Lorville"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>

            {/* Sell Location */}
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
                SELL LOCATION *
              </label>
              <input
                type="text"
                value={sellLocation}
                onChange={(e) => setSellLocation(e.target.value)}
                placeholder="e.g. Area18"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.textPrimary,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>

            {/* Buy Price */}
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
                BUY PRICE (aUEC/UNIT) *
              </label>
              <input
                type="number"
                value={buyPrice || ''}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.loss,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>

            {/* Sell Price */}
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
                SELL PRICE (aUEC/UNIT) *
              </label>
              <input
                type="number"
                value={sellPrice || ''}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: COLORS.bgDark,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  color: COLORS.profit,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.textSecondary,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              NOTES (OPTIONAL)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `1px solid ${COLORS.bgLight}`,
                borderRadius: '2px',
                color: COLORS.textPrimary,
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.cyan}
              onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '16px',
              background: submitting
                ? COLORS.bgLight
                : `linear-gradient(135deg, ${COLORS.cyan} 0%, ${COLORS.cyanLight} 100%)`,
              border: `1px solid ${submitting ? COLORS.bgLight : COLORS.cyan}`,
              borderRadius: '2px',
              color: submitting ? COLORS.textTertiary : COLORS.bgDark,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: submitting ? 'none' : `0 0 20px ${COLORS.cyan}40`,
              transition: 'all 0.2s ease'
            }}
          >
            {submitting ? (
              <>
                <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                SUBMITTING...
              </>
            ) : (
              <>
                <Truck size={16} />
                START CARGO RUN
              </>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE RUNS */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          background: `${COLORS.cyan}10`,
          border: `1px solid ${COLORS.cyan}40`,
          borderLeft: `3px solid ${COLORS.cyan}`,
          borderRadius: '2px'
        }}>
          <Clock style={{ width: '20px', height: '20px', color: COLORS.cyan }} />
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: COLORS.cyan,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontFamily: 'monospace'
          }}>
            ACTIVE RUNS ({activeRuns.length})
          </div>
        </div>

        {activeRuns.length === 0 ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            background: `${COLORS.bgMedium}40`,
            border: `1px dashed ${COLORS.bgLight}`,
            borderRadius: '4px'
          }}>
            <Truck style={{
              width: '48px',
              height: '48px',
              color: COLORS.textTertiary,
              margin: '0 auto 16px',
              opacity: 0.5
            }} />
            <div style={{
              color: COLORS.textSecondary,
              fontSize: '12px',
              letterSpacing: '1px',
              fontFamily: 'monospace'
            }}>
              NO ACTIVE CARGO RUNS
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeRuns.map(run => (
              <div
                key={run.id}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
                  border: `1px solid ${COLORS.cyan}60`,
                  borderRadius: '4px',
                  padding: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  background: `linear-gradient(180deg, ${COLORS.cyan}, transparent)`
                }} />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      marginBottom: '8px',
                      fontFamily: 'monospace'
                    }}>
                      {run.commodity_name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: COLORS.textSecondary,
                      marginBottom: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {run.buy_location} → {run.sell_location}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, auto)',
                      gap: '24px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '9px',
                          color: COLORS.textTertiary,
                          letterSpacing: '1px',
                          marginBottom: '4px',
                          fontFamily: 'monospace'
                        }}>
                          QTY
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: COLORS.cyan,
                          fontFamily: 'monospace'
                        }}>
                          {formatNumber(run.quantity)} SCU
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '9px',
                          color: COLORS.textTertiary,
                          letterSpacing: '1px',
                          marginBottom: '4px',
                          fontFamily: 'monospace'
                        }}>
                          INVESTMENT
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: COLORS.warning,
                          fontFamily: 'monospace'
                        }}>
                          {formatCurrency(run.total_investment)}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '9px',
                          color: COLORS.textTertiary,
                          letterSpacing: '1px',
                          marginBottom: '4px',
                          fontFamily: 'monospace'
                        }}>
                          EXPECTED PROFIT
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: COLORS.profit,
                          fontFamily: 'monospace'
                        }}>
                          +{formatCurrency(run.expected_profit)}
                        </div>
                      </div>

                      <div>
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
                          fontSize: '14px',
                          fontWeight: 700,
                          color: COLORS.profitLight,
                          fontFamily: 'monospace'
                        }}>
                          +{((run.expected_profit / run.total_investment) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleDeliver(run.id)}
                      style={{
                        padding: '12px 20px',
                        background: `linear-gradient(135deg, ${COLORS.profit} 0%, ${COLORS.profitLight} 100%)`,
                        border: `1px solid ${COLORS.profit}`,
                        borderRadius: '2px',
                        color: COLORS.bgDark,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: `0 0 20px ${COLORS.profit}40`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.profit}60`;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.profit}40`;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <CheckCircle size={14} />
                      DELIVER
                    </button>

                    <button
                      onClick={() => handleCancel(run.id)}
                      style={{
                        padding: '12px 16px',
                        background: `${COLORS.loss}20`,
                        border: `1px solid ${COLORS.loss}`,
                        borderRadius: '2px',
                        color: COLORS.loss,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${COLORS.loss}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${COLORS.loss}20`;
                      }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DELIVERED RUNS */}
      {deliveredRuns.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            padding: '12px 16px',
            background: `${COLORS.profit}10`,
            border: `1px solid ${COLORS.profit}40`,
            borderLeft: `3px solid ${COLORS.profit}`,
            borderRadius: '2px'
          }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: COLORS.profit }} />
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: COLORS.profit,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              COMPLETED ({deliveredRuns.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {deliveredRuns.slice(0, 5).map(run => (
              <div
                key={run.id}
                style={{
                  padding: '16px 20px',
                  background: `${COLORS.profit}05`,
                  border: `1px solid ${COLORS.profit}20`,
                  borderRadius: '2px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    fontFamily: 'monospace'
                  }}>
                    {run.commodity_name}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.textSecondary,
                    marginLeft: '16px',
                    fontFamily: 'monospace'
                  }}>
                    {run.quantity} SCU
                  </span>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: COLORS.profit,
                  fontFamily: 'monospace'
                }}>
                  +{formatCurrency(run.expected_profit)} aUEC
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}