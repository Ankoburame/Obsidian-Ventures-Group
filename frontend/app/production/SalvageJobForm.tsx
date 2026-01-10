// ============================================================
// COMPOSANT: Salvage Job Form (CIG Style)
// Identique au Mining mais pour le Salvage
// ============================================================

import React, { useState, useEffect } from "react";
import { Recycle, Plus, Trash2, Loader } from "lucide-react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Material {
  id: number;
  name: string;
  category: string;
  is_salvage: boolean;
}

interface Location {
  id: number;
  code: string;
  name: string;
  system: string;
  location_type: string;
}

interface MaterialInput {
  material_id: number;
  quantity_refined: number;
}

interface SalvageJobFormProps {
  onJobCreated: () => void;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function SalvageJobForm({ onJobCreated }: SalvageJobFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [refineries, setRefineries] = useState<Location[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [refineryId, setRefineryId] = useState<number>(0);
  const [materialInputs, setMaterialInputs] = useState<MaterialInput[]>([
    { material_id: 0, quantity_refined: 0 }
  ]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [processingHours, setProcessingHours] = useState<number>(0);
  const [processingMinutes, setProcessingMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      };

      const [refRes, matRes] = await Promise.all([
        fetch(`${API_URL}/reference/refineries`, { headers }),
        fetch(`${API_URL}/reference/salvage-materials`, { headers })
      ]);

      const refData = await refRes.json();
      const matData = await matRes.json();

      // Protection contre null
      const refineries = Array.isArray(refData) ? refData : [];
      const materials = Array.isArray(matData) ? matData : [];

      setRefineries(refineries);
      setMaterials(materials);

      // Set default refinery
      if (refineries.length > 0) {
        setRefineryId(refineries[0].id);
      }
    } catch (e) {
      console.error("Error loading salvage form data:", e);
    }
    setLoading(false);
  }

  const addMaterialInput = () => {
    setMaterialInputs([...materialInputs, { material_id: 0, quantity_refined: 0 }]);
  };

  const removeMaterialInput = (index: number) => {
    if (materialInputs.length > 1) {
      setMaterialInputs(materialInputs.filter((_, i) => i !== index));
    }
  };

  const updateMaterialInput = (index: number, field: keyof MaterialInput, value: number) => {
    const updated = [...materialInputs];
    updated[index][field] = value;
    setMaterialInputs(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (!refineryId) {
      alert("Please select a refinery");
      return;
    }

    const validMaterials = materialInputs.filter(m => m.material_id > 0 && m.quantity_refined > 0);
    if (validMaterials.length === 0) {
      alert("Please add at least one material");
      return;
    }

    const totalMinutes = (processingHours * 60) + processingMinutes;
    if (totalMinutes <= 0) {
      alert("Please set processing time");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        refinery_id: refineryId,
        job_type: "salvage",  // ← Type salvage
        materials: validMaterials,
        total_cost: totalCost || 0,
        processing_time: totalMinutes,
        notes: notes || null
      };

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/production/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`  // AJOUTER CETTE LIGNE
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to create salvage job");
      }

      // Reset form
      setMaterialInputs([{ material_id: 0, quantity_refined: 0 }]);
      setTotalCost(0);
      setProcessingHours(0);
      setProcessingMinutes(0);
      setNotes("");
      setIsOpen(false);

      // Callback
      onJobCreated();

    } catch (e: any) {
      console.error("Error creating salvage job:", e);
      alert("Failed to create salvage job: " + e.message);
    }

    setSubmitting(false);
  };

  return (
    <>
      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '16px 24px',
          background: isOpen
            ? `linear-gradient(135deg, ${COLORS.red}30 0%, ${COLORS.red}20 100%)`
            : `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
          border: `1px solid ${isOpen ? COLORS.red : COLORS.bgLight}`,
          borderRadius: '4px',
          color: isOpen ? COLORS.red : COLORS.textPrimary,
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
          boxShadow: isOpen ? `0 0 20px ${COLORS.red}30` : 'none',
          marginBottom: '32px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            background: isOpen ? COLORS.red : COLORS.orange
          }} />
          NEW SALVAGE JOB
        </span>
        <Recycle style={{ width: '20px', height: '20px' }} />
      </button>

      {/* FORM */}
      <div style={{
        maxHeight: isOpen ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s ease-in-out',
        marginBottom: isOpen ? '40px' : '0'
      }}>
        {loading ? (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            background: COLORS.bgMedium,
            border: `1px solid ${COLORS.bgLight}`,
            borderRadius: '4px'
          }}>
            <Loader style={{
              width: '32px',
              height: '32px',
              color: COLORS.red,
              margin: '0 auto 12px',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              color: COLORS.textSecondary,
              fontSize: '11px',
              letterSpacing: '1px',
              fontFamily: 'monospace'
            }}>
              LOADING SALVAGE DATA...
            </div>
          </div>
        ) : (
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
            border: `1px solid ${COLORS.red}60`,
            borderRadius: '4px',
            padding: '24px',
            position: 'relative',
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
          }}>
            {/* Header bar rouge */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${COLORS.red}, ${COLORS.redDark})`
            }} />

            {/* Header */}
            <div style={{
              fontSize: '11px',
              color: COLORS.red,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '24px',
              fontFamily: 'monospace'
            }}>
              // SALVAGE JOB :: CONFIGURATION
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Refinery */}
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
                  onFocus={(e) => e.target.style.borderColor = COLORS.red}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                >
                  {refineries.map(ref => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name} ({ref.system})
                    </option>
                  ))}
                </select>
              </div>

              {/* Materials */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <label style={{
                    fontSize: '10px',
                    color: COLORS.textSecondary,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace'
                  }}>
                    SALVAGED MATERIALS
                  </label>
                  <button
                    onClick={addMaterialInput}
                    style={{
                      padding: '6px 12px',
                      background: `${COLORS.greenOlive}30`,
                      border: `1px solid ${COLORS.greenOlive}`,
                      borderRadius: '2px',
                      color: COLORS.greenOlive,
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${COLORS.greenOlive}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${COLORS.greenOlive}30`;
                    }}
                  >
                    <Plus size={12} />
                    ADD MATERIAL
                  </button>
                </div>

                {materialInputs.map((input, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: `${COLORS.bgDark}80`,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px'
                  }}>
                    <select
                      value={input.material_id}
                      onChange={(e) => updateMaterialInput(index, 'material_id', Number(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.textPrimary,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.red}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    >
                      <option value={0}>Select material...</option>
                      {materials.map(mat => (
                        <option key={mat.id} value={mat.id}>{mat.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={input.quantity_refined || ''}
                      onChange={(e) => updateMaterialInput(index, 'quantity_refined', Number(e.target.value))}
                      placeholder="Quantity (raw units)"
                      min="0"
                      style={{
                        width: '180px',
                        padding: '10px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.orange,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.red}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    />

                    {materialInputs.length > 1 && (
                      <button
                        onClick={() => removeMaterialInput(index)}
                        style={{
                          padding: '10px',
                          background: `${COLORS.red}30`,
                          border: `1px solid ${COLORS.red}`,
                          borderRadius: '2px',
                          color: COLORS.red,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${COLORS.red}50`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${COLORS.red}30`;
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Cost & Processing Time */}
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
                    onFocus={(e) => e.target.style.borderColor = COLORS.red}
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      value={processingHours || ''}
                      onChange={(e) => setProcessingHours(Number(e.target.value))}
                      placeholder="Hours"
                      min="0"
                      max="999"
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.orange,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        outline: 'none',
                        textAlign: 'center'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.red}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    />
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: COLORS.textTertiary,
                      fontFamily: 'monospace',
                      fontSize: '16px'
                    }}>:</span>
                    <input
                      type="number"
                      value={processingMinutes || ''}
                      onChange={(e) => setProcessingMinutes(Number(e.target.value))}
                      placeholder="Min"
                      min="0"
                      max="59"
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: COLORS.bgDark,
                        border: `1px solid ${COLORS.bgLight}`,
                        borderRadius: '2px',
                        color: COLORS.orange,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        outline: 'none',
                        textAlign: 'center'
                      }}
                      onFocus={(e) => e.target.style.borderColor = COLORS.red}
                      onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    />
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
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.red}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>

              {/* Submit */}
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
                    e.currentTarget.style.transform = 'translateY(-1px)';
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
                    <Loader style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Recycle style={{ width: '16px', height: '16px' }} />
                    SUBMIT SALVAGE ORDER
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}