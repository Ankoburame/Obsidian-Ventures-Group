// ============================================================
// COMPOSANT: New Refining Job Form (Collapsible)
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
}

interface Refinery {
  id: number;
  name: string;
  system: string;
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
  const [refineries, setRefineries] = useState<Refinery[]>([]);
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

  // Load refineries and materials
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [refRes, matRes] = await Promise.all([
          fetch(`${API_URL}/reference/refineries`),
          fetch(`${API_URL}/reference/materials`)
        ]);

        const refData = await refRes.json();
        const matData = await matRes.json();

        // FILTRE: Exclure les matériaux "Raw" (non raffinables)
        const validData = Array.isArray(matData) ? matData : [];
        const refinableMaterials = validData.filter((mat: Material) =>
          !mat.name.includes('(Raw)') && !mat.name.endsWith('Raw')
        );
        setRefineries(refData);
        setMaterials(refinableMaterials);  // ← Liste filtrée

        // Set default refinery
        if (refData.length > 0) {
          setRefineryId(refData[0].id);
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
          Authorization: `Bearer ${token}`,  // ✅ AJOUTER
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
            width: '8px',
            height: '8px',
            background: isOpen ? COLORS.orange : COLORS.textTertiary,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            transition: 'background 0.3s ease'
          }} />
          NEW REFINING JOB
        </span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Collapsible Form */}
      <div style={{
        maxHeight: isOpen ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s ease-in-out',
        marginTop: isOpen ? '16px' : '0'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `1px solid ${COLORS.orange}60`,
          borderRadius: '4px',
          padding: '24px',
          position: 'relative',
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

          {/* Corner accents */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '12px',
            height: '12px',
            borderTop: `1px solid ${COLORS.orange}`,
            borderRight: `1px solid ${COLORS.orange}`
          }} />

          {/* Title */}
          <div style={{
            fontSize: '11px',
            color: COLORS.red,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '24px',
            paddingTop: '4px',
            fontFamily: 'monospace'
          }}>
            // RAFFINAGE :: SETUP
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
              <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <div style={{ marginTop: '12px', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                LOADING DATA...
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
                  REFINERY STATION
                </label>
                <select
                  value={refineryId}
                  onChange={(e) => setRefineryId(Number(e.target.value))}
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
                  onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                >
                  {refineries.map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name} :: {ref.system}
                    </option>
                  ))}
                </select>
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
                  MATERIALS TO REFINE
                  <div style={{
                    fontSize: '9px',
                    color: COLORS.textTertiary,
                    fontFamily: 'monospace',
                    marginBottom: '8px',
                    fontStyle: 'italic'
                  }}>
                    Note: Quantities are automatically converted to SCU (÷100) when collected
                  </div>
                </label>

                <div style={{
                  background: `${COLORS.bgDark}80`,
                  border: `1px solid ${COLORS.bgLight}`,
                  borderRadius: '2px',
                  padding: '16px'
                }}>
                  {materialLines.map((line, idx) => (
                    <div key={line.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 150px 40px',
                      gap: '12px',
                      marginBottom: idx < materialLines.length - 1 ? '12px' : 0,
                      alignItems: 'center'
                    }}>
                      <select
                        value={line.material_id}
                        onChange={(e) => updateMaterialLine(line.id, 'material_id', Number(e.target.value))}
                        style={{
                          padding: '10px',
                          background: COLORS.bgMedium,
                          border: `1px solid ${COLORS.bgLight}`,
                          borderRadius: '2px',
                          color: COLORS.textPrimary,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
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
                        placeholder="Quantity"
                        min="0"
                        style={{
                          padding: '10px',
                          background: COLORS.bgMedium,
                          border: `1px solid ${COLORS.bgLight}`,
                          borderRadius: '2px',
                          color: COLORS.orange,
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                      />

                      <button
                        onClick={() => removeMaterialLine(line.id)}
                        disabled={materialLines.length === 1}
                        style={{
                          padding: '10px',
                          background: materialLines.length === 1 ? COLORS.bgLight : `${COLORS.red}30`,
                          border: `1px solid ${materialLines.length === 1 ? COLORS.bgLight : COLORS.red}`,
                          borderRadius: '2px',
                          color: materialLines.length === 1 ? COLORS.textTertiary : COLORS.red,
                          cursor: materialLines.length === 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (materialLines.length > 1) {
                            e.currentTarget.style.background = `${COLORS.red}50`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (materialLines.length > 1) {
                            e.currentTarget.style.background = `${COLORS.red}30`;
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addMaterialLine}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '10px',
                      background: `${COLORS.greenOlive}20`,
                      border: `1px dashed ${COLORS.greenOlive}`,
                      borderRadius: '2px',
                      color: COLORS.greenOlive,
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
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
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}