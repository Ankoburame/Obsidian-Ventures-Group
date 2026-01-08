"use client";

import { useState, useEffect } from "react";
import { Search, Zap, Factory, Sparkles, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ScanSignature {
  id: number;
  type: string;
  category: string;
  signatures: number[];
  description?: string;
}

interface Refinery {
  id: number;
  name: string;
  system: string;
  location: string;
  is_active: boolean;
  bonuses?: RefineryBonus[];
}

interface RefineryBonus {
  id: number;
  material_name: string;
  bonus_percentage: number;
}

interface RefiningMethod {
  id: number;
  name: string;
  time: string;
  cost: string;
  yield_rating: string;
  description?: string;
}

export default function RefiningReferencePage() {
  const [activeTab, setActiveTab] = useState<"signatures" | "refineries" | "methods">("signatures");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Data states
  const [signatures, setSignatures] = useState<ScanSignature[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [methods, setMethods] = useState<RefiningMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all data
      const [sigRes, refRes, methRes] = await Promise.all([
        fetch(`${API_URL}/reference/scan-signatures`),
        fetch(`${API_URL}/reference/refineries`),
        fetch(`${API_URL}/reference/refining-methods`),
      ]);

      const sigData = await sigRes.json();
      const refData = await refRes.json();
      const methData = await methRes.json();

      setSignatures(Array.isArray(sigData) ? sigData : []);
      setRefineries(Array.isArray(refData) ? refData : []);
      setMethods(Array.isArray(methData) ? methData : []);
    } catch (e) {
      console.error("Error loading reference data:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: "32px", 
      maxWidth: "1600px", 
      position: "relative",
      minHeight: "100vh",
    }}>
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HEADER */}
        <div style={{ marginBottom: "48px", position: "relative" }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "4px",
            height: "100%",
            background: "linear-gradient(180deg, #06b6d4 0%, transparent 100%)",
          }} />

          <div style={{ paddingLeft: "24px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "12px",
            }}>
              <Sparkles style={{ width: "32px", height: "32px", color: "#06b6d4" }} />
              <h1 style={{
                fontSize: "42px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "4px",
                textTransform: "uppercase",
                margin: 0,
                background: "linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                REFINING REFERENCE
              </h1>
            </div>
            <div style={{
              color: "#71717a",
              fontSize: "14px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}>
              // KNOWLEDGE DATABASE
            </div>
          </div>

          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, #06b6d4 0%, transparent 50%, #06b6d4 100%)",
            opacity: 0.3,
            marginTop: "24px",
          }} />
        </div>

        {/* TABS */}
        <div style={{
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          padding: "8px",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "12px",
          border: "1px solid rgba(6, 182, 212, 0.2)",
        }}>
          {[
            { id: "signatures", label: "Scan Signatures", icon: Search },
            { id: "refineries", label: "Refineries", icon: Factory },
            { id: "methods", label: "Methods", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)"
                    : "transparent",
                  border: isActive ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid transparent",
                  borderRadius: "8px",
                  color: isActive ? "#06b6d4" : "#71717a",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  boxShadow: isActive ? "0 0 20px rgba(6, 182, 212, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(6, 182, 212, 0.05)";
                    e.currentTarget.style.color = "#a1a1aa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#71717a";
                  }
                }}
              >
                <Icon style={{ width: "20px", height: "20px" }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT AREA */}
        {loading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            minHeight: "400px",
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              border: "4px solid transparent",
              borderTopColor: "#06b6d4",
              borderRightColor: "#06b6d4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }} />
            <div style={{
              color: "#52525b",
              fontSize: "14px",
              letterSpacing: "3px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
              LOADING DATA...
            </div>
          </div>
        ) : (
          <>
            {activeTab === "signatures" && (
              <SignaturesTab signatures={signatures} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            )}
            {activeTab === "refineries" && (
              <RefineriesTab refineries={refineries} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            )}
            {activeTab === "methods" && (
              <MethodsTab methods={methods} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// SIGNATURES TAB
function SignaturesTab({ signatures, searchTerm, setSearchTerm }: any) {
  const filtered = signatures.filter((sig: ScanSignature) =>
    sig.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sig.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set<string>(signatures.map((s: ScanSignature) => s.category)));

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "32px", position: "relative" }}>
        <Search style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "20px",
          height: "20px",
          color: "#52525b",
        }} />
        <input
          type="text"
          placeholder="Search signatures..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 16px 16px 48px",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Categories */}
      {categories.map((category: string) => {
        const catSigs = filtered.filter((s: ScanSignature) => s.category === category);
        if (catSigs.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: "32px" }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#06b6d4",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <ChevronRight style={{ width: "20px", height: "20px" }} />
              {category}
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}>
              {catSigs.map((sig: ScanSignature) => (
                <div
                  key={sig.id}
                  style={{
                    background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)",
                    border: "1px solid rgba(6, 182, 212, 0.2)",
                    borderRadius: "8px",
                    padding: "20px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(6, 182, 212, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "white",
                    marginBottom: "12px",
                  }}>
                    {sig.type}
                  </div>
                  {sig.description && (
                    <div style={{
                      fontSize: "12px",
                      color: "#71717a",
                      marginBottom: "12px",
                    }}>
                      {sig.description}
                    </div>
                  )}
                  {sig.signatures && sig.signatures.length > 0 && (
                    <div style={{
                      fontSize: "11px",
                      color: "#52525b",
                      fontFamily: "monospace",
                      lineHeight: 1.6,
                    }}>
                      {sig.signatures.slice(0, 6).join(", ")}
                      {sig.signatures.length > 6 && "..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// REFINERIES TAB
function RefineriesTab({ refineries, searchTerm, setSearchTerm }: any) {
  const filtered = refineries.filter((ref: Refinery) =>
    ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.system.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "32px", position: "relative" }}>
        <Search style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "20px",
          height: "20px",
          color: "#52525b",
        }} />
        <input
          type="text"
          placeholder="Search refineries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "16px 16px 16px 48px",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* Refineries Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
        gap: "24px",
      }}>
        {filtered.map((ref: Refinery) => {
          const code = ref.name.split(" - ")[0] || ref.name.substring(0, 10);
          
          return (
            <div
              key={ref.id}
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(6, 182, 212, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}>
                <div style={{
                  padding: "8px 16px",
                  background: "rgba(6, 182, 212, 0.2)",
                  border: "1px solid rgba(6, 182, 212, 0.4)",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#06b6d4",
                  fontFamily: "monospace",
                }}>
                  {code}
                </div>
                <div>
                  <div style={{
                    fontSize: "11px",
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>
                    {ref.system} • {ref.location}
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "white",
                marginBottom: "16px",
              }}>
                {ref.name.split(" - ")[1] || ref.name}
              </div>

              {ref.bonuses && ref.bonuses.length > 0 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}>
                  <div style={{
                    fontSize: "11px",
                    color: "#52525b",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}>
                    Top Bonuses:
                  </div>
                  {ref.bonuses.slice(0, 5).map((bonus, idx) => {
                    const isPositive = bonus.bonus_percentage > 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "rgba(0, 0, 0, 0.3)",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#a1a1aa" }}>{bonus.material_name}</span>
                        <span style={{
                          color: isPositive ? "#10b981" : "#ef4444",
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}>
                          {isPositive ? "+" : ""}{bonus.bonus_percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// METHODS TAB
function MethodsTab({ methods }: any) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "24px",
    }}>
      {methods.map((method: RefiningMethod) => (
        <div
          key={method.id}
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            borderRadius: "12px",
            padding: "24px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(6, 182, 212, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.2)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#06b6d4",
            marginBottom: "16px",
          }}>
            {method.name}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginBottom: "16px",
          }}>
            {[
              { label: "Time", value: method.time },
              { label: "Cost", value: method.cost },
              { label: "Yield", value: method.yield_rating },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "12px",
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div style={{
                  fontSize: "10px",
                  color: "#52525b",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "white",
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {method.description && (
            <div style={{
              fontSize: "12px",
              color: "#71717a",
              lineHeight: 1.6,
              fontStyle: "italic",
            }}>
              {method.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}