"use client";

import { useState } from "react";
import { Radar, Factory, Zap, ChevronDown, ChevronUp } from "lucide-react";
import scanData from "@/public/scan_signatures.json";
import refineryData from "@/public/refinery_bonuses.json";
import methodsData from "@/public/refining_methods.json";

const COLORS = {
  orange: "#d97706",
  cyan: "#22d3ee",
  cyanDark: "#0891b2",
  green: "#10b981",
  greenBright: "#22c55e",
  red: "#ef4444",
  redBright: "#f87171",
  bgDark: "#0f172a",
  bgMedium: "#1e293b",
  bgLight: "#334155",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
};

// Particle effect
function ParticleField() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      opacity: 0.15,
      pointerEvents: 'none',
      background: `
        radial-gradient(2px 2px at 20% 30%, ${COLORS.cyan}, transparent),
        radial-gradient(2px 2px at 60% 70%, ${COLORS.orange}, transparent),
        radial-gradient(1px 1px at 50% 50%, white, transparent),
        radial-gradient(1px 1px at 80% 10%, ${COLORS.cyan}, transparent),
        radial-gradient(2px 2px at 90% 60%, ${COLORS.orange}, transparent),
        radial-gradient(1px 1px at 33% 80%, white, transparent),
        radial-gradient(1px 1px at 15% 90%, ${COLORS.cyan}, transparent)
      `,
      backgroundSize: '200% 200%',
      animation: 'particle-drift 20s ease-in-out infinite alternate'
    }} />
  );
}

export default function RefiningReferencePage() {
  const [activeTab, setActiveTab] = useState<"signatures" | "refineries" | "methods">("signatures");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: COLORS.bgDark,
      position: 'relative',
      padding: '40px'
    }}>
      <ParticleField />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1800px', margin: '0 auto' }}>
        {/* HEADER */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '4px',
              height: '80px',
              background: `linear-gradient(180deg, ${COLORS.cyan}, transparent)`
            }} />
            <div>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 700,
                color: COLORS.textPrimary,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'monospace',
                textShadow: `0 0 20px ${COLORS.cyan}60`
              }}>
                REFINING REFERENCE
              </h1>
              <div style={{
                color: COLORS.textSecondary,
                fontSize: '12px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontFamily: 'monospace'
              }}>
                // KNOWLEDGE DATABASE :: SYSTEM ACCESS
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px'
        }}>
          {[
            { id: "signatures", label: "SCAN SIGNATURES", icon: Radar },
            { id: "refineries", label: "REFINERY BONUSES", icon: Factory },
            { id: "methods", label: "REFINING METHODS", icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: isActive
                    ? `linear-gradient(135deg, ${COLORS.cyan}30 0%, ${COLORS.cyan}20 100%)`
                    : COLORS.bgMedium,
                  border: `1px solid ${isActive ? COLORS.cyan : COLORS.bgLight}`,
                  borderRadius: '4px',
                  color: isActive ? COLORS.cyan : COLORS.textSecondary,
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 20px ${COLORS.cyan}40` : 'none'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        {activeTab === "signatures" && <SignaturesTab expandedSection={expandedSection} setExpandedSection={setExpandedSection} />}
        {activeTab === "refineries" && <RefineriesTab />}
        {activeTab === "methods" && <MethodsTab />}
      </div>

      <style jsx>{`
        @keyframes particle-drift {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// SCAN SIGNATURES TAB
// ============================================================
function SignaturesTab({ expandedSection, setExpandedSection }: any) {
  const sections = [
    { id: 'ground', title: 'GROUND DEPOSITS', data: scanData.surface_deposits },
    { id: 'asteroids', title: 'SPACE ASTEROIDS', data: scanData.space_asteroids },
    { id: 'salvage', title: 'SALVAGE', data: null }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {sections.map(section => {
        const isExpanded = expandedSection === section.id;
        
        return (
          <div key={section.id}>
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
                border: `1px solid ${isExpanded ? COLORS.cyan : COLORS.bgLight}`,
                borderRadius: '4px',
                color: isExpanded ? COLORS.cyan : COLORS.textPrimary,
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'monospace',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded ? `0 0 20px ${COLORS.cyan}30` : 'none'
              }}
            >
              {section.title}
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isExpanded && section.data && (
              <div style={{
                marginTop: '16px',
                background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
                border: `1px solid ${COLORS.cyan}40`,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: `${COLORS.cyan}20`, borderBottom: `2px solid ${COLORS.cyan}` }}>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        color: COLORS.cyan,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace'
                      }}>
                        TYPE
                      </th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        color: COLORS.cyan,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace'
                      }}>
                        SIGNATURES
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: `1px solid ${COLORS.bgLight}40`,
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.cyan}10`}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{
                          padding: '16px',
                          color: COLORS.textPrimary,
                          fontSize: '14px',
                          fontWeight: 600,
                          fontFamily: 'monospace'
                        }}>
                          {item.type}
                        </td>
                        <td style={{
                          padding: '16px',
                          color: COLORS.textSecondary,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          lineHeight: 1.6
                        }}>
                          {item.signatures.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isExpanded && section.id === 'salvage' && (
              <div style={{
                marginTop: '16px',
                background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100())`,
                border: `1px solid ${COLORS.cyan}40`,
                borderRadius: '4px',
                padding: '24px'
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    color: COLORS.cyan,
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    fontFamily: 'monospace'
                  }}>
                    DEBRIS
                  </div>
                  <div style={{
                    color: COLORS.textSecondary,
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}>
                    {scanData.salvage.debris.pattern}
                  </div>
                </div>
                <div>
                  <div style={{
                    color: COLORS.cyan,
                    fontSize: '16px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    fontFamily: 'monospace'
                  }}>
                    WRECKS
                  </div>
                  <div style={{
                    color: COLORS.textSecondary,
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}>
                    {scanData.salvage.wrecks.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// REFINERY BONUSES TAB
// ============================================================
function RefineriesTab() {
  // Get all unique materials
  const allMaterials = new Set<string>();
  refineryData.refineries.forEach(ref => {
    Object.keys(ref.bonuses).forEach(mat => allMaterials.add(mat));
  });
  const materials = Array.from(allMaterials).sort();

  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
      border: `1px solid ${COLORS.cyan}40`,
      borderRadius: '4px',
      overflow: 'auto'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
        <thead>
          <tr style={{ background: `${COLORS.cyan}20`, borderBottom: `2px solid ${COLORS.cyan}` }}>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              position: 'sticky',
              left: 0,
              background: `${COLORS.cyan}20`,
              zIndex: 2
            }}>
              REFINERY
            </th>
            {materials.map(mat => (
              <th key={mat} style={{
                padding: '16px',
                textAlign: 'center',
                color: COLORS.cyan,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontFamily: 'monospace'
              }}>
                {mat}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {refineryData.refineries.map((ref, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: `1px solid ${COLORS.bgLight}40`,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.cyan}10`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '16px',
                color: COLORS.textPrimary,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'monospace',
                position: 'sticky',
                left: 0,
                background: COLORS.bgMedium,
                zIndex: 1
              }}>
                <div>{ref.code}</div>
                <div style={{ fontSize: '10px', color: COLORS.textSecondary }}>{ref.parent}</div>
              </td>
              {materials.map(mat => {
                const bonus = ref.bonuses[mat as keyof typeof ref.bonuses];
                const isPositive = bonus && bonus > 0;
                const isNegative = bonus && bonus < 0;
                
                return (
                  <td key={mat} style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: bonus === undefined ? COLORS.bgLight :
                           isPositive ? COLORS.greenBright :
                           isNegative ? COLORS.redBright : COLORS.textPrimary,
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    background: isPositive ? `${COLORS.green}15` :
                                isNegative ? `${COLORS.red}15` : 'transparent'
                  }}>
                    {bonus !== undefined ? (bonus > 0 ? `+${bonus}%` : `${bonus}%`) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// REFINING METHODS TAB
// ============================================================
function MethodsTab() {
  const getRatingColor = (value: string) => {
    if (value.includes('Low') || value === 'Low') return COLORS.greenBright;
    if (value.includes('Medium') || value === 'Medium') return COLORS.textPrimary;
    if (value.includes('High') || value === 'High') return COLORS.redBright;
    if (value === 'Very Low') return COLORS.greenBright;
    return COLORS.textSecondary;
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
      border: `1px solid ${COLORS.cyan}40`,
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: `${COLORS.cyan}20`, borderBottom: `2px solid ${COLORS.cyan}` }}>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              width: '30%'
            }}>
              METHOD
            </th>
            <th style={{
              padding: '16px',
              textAlign: 'center',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              TIME
            </th>
            <th style={{
              padding: '16px',
              textAlign: 'center',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              COST
            </th>
            <th style={{
              padding: '16px',
              textAlign: 'center',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              YIELD
            </th>
            <th style={{
              padding: '16px',
              textAlign: 'left',
              color: COLORS.cyan,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}>
              NOTES
            </th>
          </tr>
        </thead>
        <tbody>
          {methodsData.map((method, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: `1px solid ${COLORS.bgLight}40`,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.cyan}10`}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{
                padding: '16px',
                color: COLORS.textPrimary,
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'monospace'
              }}>
                {method.name}
              </td>
              <td style={{
                padding: '16px',
                textAlign: 'center',
                color: getRatingColor(method.time),
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                textShadow: `0 0 10px ${getRatingColor(method.time)}60`
              }}>
                {method.time}
              </td>
              <td style={{
                padding: '16px',
                textAlign: 'center',
                color: getRatingColor(method.cost),
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                textShadow: `0 0 10px ${getRatingColor(method.cost)}60`
              }}>
                {method.cost}
              </td>
              <td style={{
                padding: '16px',
                textAlign: 'center',
                color: getRatingColor(method.yield),
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                textShadow: `0 0 10px ${getRatingColor(method.yield)}60`
              }}>
                {method.yield}
              </td>
              <td style={{
                padding: '16px',
                color: COLORS.textSecondary,
                fontSize: '12px',
                fontFamily: 'monospace',
                fontStyle: 'italic'
              }}>
                {method.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}