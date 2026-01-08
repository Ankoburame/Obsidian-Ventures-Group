"use client";

import React, { useState } from 'react';
import { Calculator, Users, DollarSign, TrendingDown, Copy, Check } from 'lucide-react';

const COLORS = {
  orange: "#d97706",
  orangeLight: "#f59e0b",
  red: "#dc2626",
  redDark: "#991b1b",
  yellow: "#eab308",
  yellowLight: "#facc15",
  greenOlive: "#84a98c",
  greenOliveLight: "#a3b18a",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  bgLight: "#334155",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
};

const TRANSFER_TAX_RATE = 0.005; // 0.5%

interface PayoutResult {
  totalRevenue: number;
  numParticipants: number;
  baseShare: number;
  taxPerTransfer: number;
  totalTaxBurden: number;
  sellerAmount: number;
  otherAmount: number;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export default function PayoutPage() {
  const [totalRevenue, setTotalRevenue] = useState<string>('');
  const [numParticipants, setNumParticipants] = useState<string>('');
  const [result, setResult] = useState<PayoutResult | null>(null);
  const [copied, setCopied] = useState(false);

  const calculatePayout = () => {
    const revenue = parseFloat(totalRevenue);
    const participants = parseInt(numParticipants);

    if (isNaN(revenue) || isNaN(participants) || revenue <= 0 || participants <= 0) {
      alert('Veuillez entrer des valeurs valides');
      return;
    }

    const baseShare = revenue / participants;
    const taxPerTransfer = baseShare * TRANSFER_TAX_RATE;
    const totalTaxBurden = taxPerTransfer * (participants - 1);
    const sellerAmount = baseShare - totalTaxBurden;
    const otherAmount = baseShare;

    setResult({
      totalRevenue: revenue,
      numParticipants: participants,
      baseShare,
      taxPerTransfer,
      totalTaxBurden,
      sellerAmount,
      otherAmount
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummary = () => {
    if (!result) return '';
    
    let summary = `CREW PAYOUT - ${formatNumber(result.totalRevenue)} aUEC\n`;
    summary += `Participants: ${result.numParticipants}\n\n`;
    summary += `VENDEUR: ${formatNumber(result.sellerAmount)} aUEC\n`;
    for (let i = 2; i <= result.numParticipants; i++) {
      summary += `Membre ${i}: ${formatNumber(result.otherAmount)} aUEC\n`;
    }
    summary += `\nTaxe totale: ${formatNumber(result.totalTaxBurden)} aUEC (${(TRANSFER_TAX_RATE * 100)}%)`;
    
    return summary;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bgDark,
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Hex background pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.3,
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(217,119,6,0.02) 2px, rgba(217,119,6,0.02) 4px),
          repeating-linear-gradient(60deg, transparent, transparent 2px, rgba(217,119,6,0.02) 2px, rgba(217,119,6,0.02) 4px),
          repeating-linear-gradient(120deg, transparent, transparent 2px, rgba(217,119,6,0.02) 2px, rgba(217,119,6,0.02) 4px)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${COLORS.red}40`,
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: -8,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.redDark}, transparent)`
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '3px',
              height: '60px',
              background: `linear-gradient(180deg, ${COLORS.orange} 0%, transparent 100%)`
            }} />
            <div>
              <div style={{
                fontSize: '11px',
                color: COLORS.red,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '8px',
                fontFamily: 'monospace'
              }}>
                // CREW PAYMENT CALCULATOR
              </div>
              <h1 style={{
                fontSize: '38px',
                fontWeight: 700,
                color: COLORS.textPrimary,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'monospace',
                textShadow: `0 0 15px ${COLORS.orange}40`
              }}>
                PAYOUT DISTRIBUTION
              </h1>
            </div>
          </div>

          <div style={{
            fontSize: '12px',
            color: COLORS.textSecondary,
            fontFamily: 'monospace',
            marginLeft: '20px'
          }}>
            Split équitable avec taxe de transfert 0.5%
          </div>
        </div>

        {/* Calculator Form */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `1px solid ${COLORS.orange}60`,
          borderRadius: '4px',
          padding: '32px',
          marginBottom: '32px',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
        }}>
          {/* Red header bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.redDark}, transparent)`
          }} />

          <div style={{
            fontSize: '11px',
            color: COLORS.red,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '24px',
            fontFamily: 'monospace'
          }}>
            // PARAMÈTRES
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Total Revenue */}
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
                MONTANT TOTAL (aUEC)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: COLORS.orange
                }} />
                <input
                  type="number"
                  value={totalRevenue}
                  onChange={(e) => setTotalRevenue(e.target.value)}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 42px',
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px',
                    color: COLORS.orange,
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>
            </div>

            {/* Number of Participants */}
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
                NOMBRE DE PARTICIPANTS
              </label>
              <div style={{ position: 'relative' }}>
                <Users style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: COLORS.orange
                }} />
                <input
                  type="number"
                  value={numParticipants}
                  onChange={(e) => setNumParticipants(e.target.value)}
                  placeholder="3"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 42px',
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px',
                    color: COLORS.textPrimary,
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculatePayout}
            style={{
              width: '100%',
              padding: '16px',
              background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.yellowLight} 100%)`,
              border: `1px solid ${COLORS.yellow}`,
              borderRadius: '2px',
              color: COLORS.bgDark,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: `0 0 20px ${COLORS.yellow}40`,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.yellow}60`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.yellow}40`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Calculator size={18} />
            CALCULER LA RÉPARTITION
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
            border: `1px solid ${COLORS.greenOlive}60`,
            borderRadius: '4px',
            padding: '32px',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
          }}>
            {/* Green header bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${COLORS.greenOlive}, transparent)`
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '11px',
                color: COLORS.greenOlive,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontWeight: 700,
                fontFamily: 'monospace'
              }}>
                // RÉSULTATS
              </div>

              <button
                onClick={() => copyToClipboard(generateSummary())}
                style={{
                  padding: '8px 16px',
                  background: copied ? `${COLORS.greenOlive}30` : `${COLORS.bgLight}`,
                  border: `1px solid ${copied ? COLORS.greenOlive : COLORS.textTertiary}`,
                  borderRadius: '2px',
                  color: copied ? COLORS.greenOlive : COLORS.textSecondary,
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'COPIÉ!' : 'COPIER'}
              </button>
            </div>

            {/* Base Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: '16px',
                background: `${COLORS.bgDark}80`,
                borderLeft: `2px solid ${COLORS.orange}`,
                borderRadius: '2px'
              }}>
                <div style={{
                  fontSize: '9px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>
                  PART DE BASE
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.orange,
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(result.baseShare)}
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: `${COLORS.bgDark}80`,
                borderLeft: `2px solid ${COLORS.red}`,
                borderRadius: '2px'
              }}>
                <div style={{
                  fontSize: '9px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>
                  TAXE PAR TRANSFERT
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.red,
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(result.taxPerTransfer)}
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: `${COLORS.bgDark}80`,
                borderLeft: `2px solid ${COLORS.red}`,
                borderRadius: '2px'
              }}>
                <div style={{
                  fontSize: '9px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase'
                }}>
                  TAXE TOTALE
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.red,
                  fontFamily: 'monospace'
                }}>
                  {formatNumber(result.totalTaxBurden)}
                </div>
              </div>
            </div>

            {/* Payout Distribution */}
            <div style={{
              padding: '20px',
              background: `${COLORS.greenOlive}15`,
              border: `1px solid ${COLORS.greenOlive}40`,
              borderRadius: '2px'
            }}>
              <div style={{
                fontSize: '10px',
                color: COLORS.greenOlive,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '16px',
                fontFamily: 'monospace',
                fontWeight: 600
              }}>
                RÉPARTITION FINALE
              </div>

              {/* Seller */}
              <div style={{
                padding: '16px',
                background: COLORS.bgDark,
                borderLeft: `3px solid ${COLORS.yellow}`,
                marginBottom: '12px',
                borderRadius: '2px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      color: COLORS.yellow,
                      letterSpacing: '1px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      VENDEUR (PAIE LA TAXE)
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: COLORS.textTertiary,
                      fontFamily: 'monospace'
                    }}>
                      Taxe déduite: {formatNumber(result.totalTaxBurden)} aUEC
                    </div>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: COLORS.yellow,
                    fontFamily: 'monospace',
                    textShadow: `0 0 10px ${COLORS.yellow}60`
                  }}>
                    {formatNumber(result.sellerAmount)}
                  </div>
                </div>
              </div>

              {/* Other Participants */}
              {Array.from({ length: result.numParticipants - 1 }).map((_, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: COLORS.bgDark,
                  borderLeft: `3px solid ${COLORS.greenOlive}`,
                  marginBottom: idx < result.numParticipants - 2 ? '12px' : 0,
                  borderRadius: '2px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '11px',
                        color: COLORS.greenOlive,
                        letterSpacing: '1px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}>
                        MEMBRE {idx + 2}
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: COLORS.textTertiary,
                        fontFamily: 'monospace'
                      }}>
                        Montant complet (pas de taxe)
                      </div>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: COLORS.greenOlive,
                      fontFamily: 'monospace',
                      textShadow: `0 0 10px ${COLORS.greenOlive}60`
                    }}>
                      {formatNumber(result.otherAmount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
