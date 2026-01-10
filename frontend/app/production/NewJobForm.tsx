// ============================================================
// COMPOSANT: New Refining Job Form (Collapsible) - CORRIGÉ UEX
// ============================================================

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
  accent: "#f97316",
  accentDark: "#ea580c"
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Material {
  id: number;
  name: string;
  category: string;
  is_mineable: boolean;
}

interface Location {
  id: number;
  code: string;
  name: string;
  system: string;
  location_type: string;
}

interface MaterialLine {
  id: string;
  material_id: number;
  quantity: number;
}

interface NewJobFormProps {
  onJobCreated: () => void;
}

export function NewJobForm({ onJobCreated }: NewJobFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data from API
  const [refineries, setRefineries] = useState<Location[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Form state
  const [refineryId, setRefineryId] = useState<number>(0);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([
    { id: Math.random().toString(), material_id: 0, quantity: 0 }
  ]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [hoursTime, setHoursTime] = useState<number>(0);
  const [minutesTime, setMinutesTime] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Load refineries and materials from UEX data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        };

        const [locRes, matRes] = await Promise.all([
          fetch(`${API_URL}/reference/refineries`, { headers }),  // ✅ Utilise le nouvel endpoint
          fetch(`${API_URL}/reference/materials`, { headers })
        ]);

        const refData = await locRes.json();
        const matData = await matRes.json();

        // Protection contre null
        const refineries = Array.isArray(refData) ? refData : [];
        const materials = Array.isArray(matData) ? matData : [];

        setRefineries(refineries);
        setMaterials(materials);

        // Set default refinery
        if (refineries.length > 0) {
          setRefineryId(refineries[0].id); // ✅ Force toujours le premier ID
          console.log("✅ Set refinery to:", refineries[0].id, refineries[0].name);
        }

      } catch (e) {
        console.error("Error loading form data:", e);
      }
      setLoading(false);
    }

    if (isOpen && refineries.length === 0) {
      loadData();
    }
  }, [isOpen, refineries.length]);

  const addMaterialLine = () => {
    setMaterialLines([
      ...materialLines,
      { id: Math.random().toString(), material_id: 0, quantity: 0 }
    ]);
  };

  const removeMaterialLine = (id: string) => {
    if (materialLines.length > 1) {
      setMaterialLines(materialLines.filter(line => line.id !== id));
    }
  };

  const updateMaterialLine = (id: string, field: 'material_id' | 'quantity', value: number) => {
    setMaterialLines(materialLines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSubmit = async () => {
    // Validation
    console.log("🔍 DEBUG:", { refineryId, refineries: refineries.slice(0, 3) });
    if (!refineryId) {
      alert("Please select a refinery");
      return;
    }

    const validMaterials = materialLines.filter(line => line.material_id > 0 && line.quantity > 0);
    if (validMaterials.length === 0) {
      alert("Please add at least one material with quantity");
      return;
    }

    const totalMinutes = (hoursTime * 60) + minutesTime;
    if (totalMinutes <= 0) {
      alert("Please set processing time");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        refinery_id: refineryId,
        job_type: "mining",
        total_cost: totalCost,
        processing_time: totalMinutes,
        notes: notes || null,
        materials: validMaterials.map(line => ({
          material_id: line.material_id,
          quantity_refined: line.quantity
        }))
      };

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/production/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      // Reset form
      setMaterialLines([{ id: Math.random().toString(), material_id: 0, quantity: 0 }]);
      setTotalCost(0);
      setHoursTime(0);
      setMinutesTime(0);
      setNotes("");
      setIsOpen(false);

      // Callback
      onJobCreated();

    } catch (e) {
      console.error("Error creating job:", e);
      alert("Failed to create refining job. Check console for details.");
    }

    setSubmitting(false);
  };

  return (
    <div style={{
      marginBottom: '32px',
      position: 'relative'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: isOpen
            ? `linear-gradient(135deg, ${COLORS.orange}30 0%, ${COLORS.orange}20 100%)`
            : `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
          border: `1px solid ${isOpen ? COLORS.orange : COLORS.bgLight}`,
          borderRadius: '4px',
          color: isOpen ? COLORS.orange : COLORS.textPrimary,
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
          boxShadow: isOpen ? `0 0 20px ${COLORS.orange}30` : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = `${COLORS.orange}60`;
            e.currentTarget.style.color = COLORS.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = COLORS.bgLight;
            e.currentTarget.style.color = COLORS.textPrimary;
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: isOpen ? COLORS.orange : COLORS.textSecondary
          }} />
          NEW REFINING JOB
        </span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Form Content */}
      {isOpen && (
        <div style={{
          marginTop: '16px',
          padding: '24px',
          background: `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
          border: `1px solid ${COLORS.orange}60`,
          borderRadius: '4px',
          boxShadow: `0 0 20px ${COLORS.orange}20`
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              color: COLORS.textSecondary
            }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} />
              Loading data...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Refinery Selection */}
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
                  REFINERY LOCATION
                </label>
                <select
                  value={refineryId}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    console.log("🔄 Refinery changed to:", newId);
                    setRefineryId(newId);
                  }}
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
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                >
                  {refineries.map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name} ({ref.system})
                    </option>
                  ))}
                </select>
                {refineries.length === 0 && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: COLORS.yellow,
                    fontFamily: 'monospace'
                  }}>
                    ⚠️ No refineries found. Import locations from UEX first.
                  </p>
                )}
              </div>

              {/* Materials */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}>
                  REFINED MATERIALS
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {materialLines.map((line, index) => (
                    <div key={line.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr auto',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <select
                        value={line.material_id}
                        onChange={(e) => updateMaterialLine(line.id, 'material_id', Number(e.target.value))}
                        style={{
                          padding: '12px',
                          background: COLORS.bgDark,
                          border: `1px solid ${COLORS.bgLight}`,
                          borderRadius: '2px',
                          color: COLORS.textPrimary,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                      >
                        <option value={0}>Select material...</option>
                        {materials.map(mat => (
                          <option key={mat.id} value={mat.id}>
                            {mat.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={line.quantity || ''}
                        onChange={(e) => updateMaterialLine(line.id, 'quantity', Number(e.target.value))}
                        placeholder="Qty (SCU)"
                        min="0"
                        style={{
                          padding: '12px',
                          background: COLORS.bgDark,
                          border: `1px solid ${COLORS.bgLight}`,
                          borderRadius: '2px',
                          color: COLORS.orange,
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          outline: 'none',
                          textAlign: 'center'
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                      />

                      {materialLines.length > 1 && (
                        <button
                          onClick={() => removeMaterialLine(line.id)}
                          style={{
                            padding: '12px',
                            background: `${COLORS.red}20`,
                            border: `1px solid ${COLORS.red}`,
                            borderRadius: '2px',
                            color: COLORS.red,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${COLORS.red}40`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${COLORS.red}20`;
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addMaterialLine}
                    style={{
                      padding: '12px',
                      background: `${COLORS.greenOlive}20`,
                      border: `1px dashed ${COLORS.greenOlive}`,
                      borderRadius: '2px',
                      color: COLORS.greenOlive,
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${COLORS.greenOlive}30`;
                      e.currentTarget.style.borderStyle = 'solid';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${COLORS.greenOlive}20`;
                      e.currentTarget.style.borderStyle = 'dashed';
                    }}
                  >
                    <Plus size={14} />
                    ADD MATERIAL
                  </button>
                </div>
              </div>

              {/* Cost & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    TOTAL COST (aUEC)
                  </label>
                  <input
                    type="number"
                    value={totalCost || ''}
                    onChange={(e) => setTotalCost(Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: COLORS.bgDark,
                      border: `1px solid ${COLORS.bgLight}`,
                      borderRadius: '2px',
                      color: COLORS.orange,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.orange}
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
                    PROCESSING TIME
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={hoursTime || ''}
                      onChange={(e) => setHoursTime(Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.textPrimary,
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        outline: 'none',
                        textAlign: 'center'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    />
                    <span style={{ color: COLORS.textSecondary, fontSize: '11px', fontFamily: 'monospace' }}>h</span>
                    <input
                      type="number"
                      value={minutesTime || ''}
                      onChange={(e) => setMinutesTime(Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      max="59"
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.textPrimary,
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        outline: 'none',
                        textAlign: 'center'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    />
                    <span style={{ color: COLORS.textSecondary, fontSize: '11px', fontFamily: 'monospace' }}>min</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
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
                  NOTES (OPTIONAL)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this refining job..."
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
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '16px',
                  background: submitting
                    ? COLORS.bgLight
                    : `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.yellowLight} 100%)`,
                  border: `1px solid ${submitting ? COLORS.bgLight : COLORS.yellow}`,
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
                  boxShadow: submitting ? 'none' : `0 0 20px ${COLORS.yellow}40`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.yellow}60`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.yellow}40`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    SUBMITTING ORDER...
                  </>
                ) : (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      background: COLORS.bgDark,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    }} />
                    SUBMIT REFINING ORDER
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}