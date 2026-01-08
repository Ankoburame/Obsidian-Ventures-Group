// ============================================================
// COMPOSANT: Sale Form + Confirmation Modal (CIG Style)
// ============================================================

import React, { useState } from "react";
import { DollarSign, TrendingUp, X, AlertCircle, CheckCircle } from "lucide-react";

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

interface InventoryItem {
  id: number;
  refinery_id: number;
  refinery_name: string;
  material_id: number;
  material_name: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
}

interface SaleFormProps {
  inventory: InventoryItem[];
  onSaleCompleted: () => void;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function SaleForm({ inventory, onSaleCompleted }: SaleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [saleLocation, setSaleLocation] = useState<string>("");
  const [refiningCost, setRefiningCost] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedItem = inventory.find(item => item.id === selectedInventoryId);
  const totalRevenue = quantity * unitPrice;
  const estimatedProfit = totalRevenue - refiningCost;
  const profitPercentage = refiningCost > 0 ? ((estimatedProfit / refiningCost) * 100) : 0;

  const handleSubmit = () => {
    // Validation
    if (!selectedInventoryId) {
      alert("Please select a material");
      return;
    }
    if (quantity <= 0) {
      alert("Please enter quantity");
      return;
    }
    if (!selectedItem || quantity > selectedItem.quantity) {
      alert(`Max quantity available: ${selectedItem?.quantity || 0} ${selectedItem?.unit}`);
      return;
    }
    if (unitPrice <= 0) {
      alert("Please enter unit price");
      return;
    }

    // Ouvrir la modale de confirmation
    setShowConfirmModal(true);
  };

  const confirmSale = async () => {
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");  // ✅ AJOUTER

      const selectedItem = inventory.find(item => item.id === selectedInventoryId);

      const payload = {
        material_id: selectedItem!.material_id,       // ✅ FIX
        refinery_source_id: selectedItem!.refinery_id, // ✅ FIX
        quantity_sold: quantity,
        unit_price: unitPrice,
        sale_location_id: null,  // ✅ FIX (ou retire complètement cette ligne)
        refining_cost: refiningCost || 0,
        notes: saleLocation || null  // ✅ Mettre la location en notes
      };

      const response = await fetch(`${API_URL}/production/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`  // ✅ AJOUTER
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to record sale");
      }

      // Reset form
      setSelectedInventoryId(0);
      setQuantity(0);
      setUnitPrice(0);
      setSaleLocation("");
      setRefiningCost(0);
      setShowConfirmModal(false);
      setIsOpen(false);

      // Callback
      onSaleCompleted();

    } catch (e: any) {
      console.error("Error recording sale:", e);
      alert("Failed to record sale: " + e.message);
    }

    setSubmitting(false);
  };

  // Auto-fill estimated price when selecting material
  const handleMaterialSelect = (inventoryId: number) => {
    setSelectedInventoryId(inventoryId);
    const item = inventory.find(i => i.id === inventoryId);
    if (item && item.estimated_unit_price > 0) {
      setUnitPrice(item.estimated_unit_price);
    }
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
            ? `linear-gradient(135deg, ${COLORS.greenOlive}30 0%, ${COLORS.greenOlive}20 100%)`
            : `linear-gradient(135deg, ${COLORS.bgMedium}f5 0%, ${COLORS.bgDark}f5 100%)`,
          border: `1px solid ${isOpen ? COLORS.greenOlive : COLORS.bgLight}`,
          borderRadius: '4px',
          color: isOpen ? COLORS.greenOlive : COLORS.textPrimary,
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
          boxShadow: isOpen ? `0 0 20px ${COLORS.greenOlive}30` : 'none',
          marginBottom: '32px'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign style={{ width: '16px', height: '16px' }} />
          RECORD NEW SALE
        </span>
        <TrendingUp style={{ width: '20px', height: '20px' }} />
      </button>

      {/* FORM */}
      <div style={{
        maxHeight: isOpen ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s ease-in-out',
        marginBottom: isOpen ? '32px' : '0'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
          border: `1px solid ${COLORS.greenOlive}60`,
          borderRadius: '4px',
          padding: '24px',
          position: 'relative',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
        }}>
          {/* Header */}
          <div style={{
            fontSize: '11px',
            color: COLORS.greenOlive,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '24px',
            fontFamily: 'monospace'
          }}>
            // SALE TRANSACTION :: RECORD
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Material Selection */}
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
                MATERIAL TO SELL
              </label>
              <select
                value={selectedInventoryId}
                onChange={(e) => handleMaterialSelect(Number(e.target.value))}
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
                onFocus={(e) => e.target.style.borderColor = COLORS.greenOlive}
                onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
              >
                <option value={0}>Select material...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.material_name} - {formatNumber(item.quantity)} {item.unit} @ {item.refinery_name}
                  </option>
                ))}
              </select>
            </div>
            {/* 💡 REFERENCE - RECENT JOBS */}
            {selectedItem && (
              <div style={{
                padding: '12px 16px',
                background: `${COLORS.orange}15`,
                border: `1px solid ${COLORS.orange}40`,
                borderLeft: `3px solid ${COLORS.orange}`,
                borderRadius: '2px'
              }}>
                <div style={{
                  fontSize: '9px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  fontFamily: 'monospace'
                }}>
                  💡 REFERENCE - DERNIERS JOBS {selectedItem.material_name.toUpperCase()}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.textSecondary,
                  fontFamily: 'monospace',
                  fontStyle: 'italic'
                }}>
                  (Calcule toi-même le coût total selon tes jobs)
                </div>
              </div>
            )}

            {/* Quantity & Unit Price */}
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
                  QUANTITY ({selectedItem?.unit || 'SCU'})
                </label>
                <input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  max={selectedItem?.quantity || 999999}
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
                  onFocus={(e) => e.target.style.borderColor = COLORS.greenOlive}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
                {selectedItem && (
                  <div style={{
                    fontSize: '10px',
                    color: COLORS.textTertiary,
                    marginTop: '4px',
                    fontFamily: 'monospace'
                  }}>
                    Max: {formatNumber(selectedItem.quantity)} {selectedItem.unit}
                  </div>
                )}
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
                  UNIT PRICE (aUEC)
                </label>
                <input
                  type="number"
                  value={unitPrice || ''}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px',
                    color: COLORS.greenOlive,
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.greenOlive}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>
            </div>

            {/* Sale Location & Refining Cost */}
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
                  SALE LOCATION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={saleLocation}
                  onChange={(e) => setSaleLocation(e.target.value)}
                  placeholder="e.g. ARC-L1, Lorville..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px',
                    color: COLORS.textPrimary,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.greenOlive}
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
                  REFINING COST (aUEC)
                </label>
                <input
                  type="number"
                  value={refiningCost || ''}
                  onChange={(e) => setRefiningCost(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: COLORS.bgDark,
                    border: `1px solid ${COLORS.bgLight}`,
                    borderRadius: '2px',
                    color: COLORS.orange,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = COLORS.greenOlive}
                  onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                />
              </div>
            </div>

            {/* Preview */}
            {quantity > 0 && unitPrice > 0 && (
              <div style={{
                padding: '16px',
                background: `${COLORS.greenOlive}15`,
                border: `1px solid ${COLORS.greenOlive}40`,
                borderLeft: `3px solid ${COLORS.greenOlive}`,
                borderRadius: '2px'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}>
                  // TRANSACTION PREVIEW
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                    Total Revenue:
                  </span>
                  <span style={{ fontSize: '14px', color: COLORS.greenOlive, fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatNumber(totalRevenue)} aUEC
                  </span>
                </div>
                {refiningCost > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                        Refining Cost:
                      </span>
                      <span style={{ fontSize: '12px', color: COLORS.orange, fontFamily: 'monospace' }}>
                        -{formatNumber(refiningCost)} aUEC
                      </span>
                    </div>
                    <div style={{
                      borderTop: `1px solid ${COLORS.greenOlive}30`,
                      paddingTop: '8px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 700, fontFamily: 'monospace' }}>
                        Net Profit:
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', color: COLORS.greenOliveLight, fontWeight: 700, fontFamily: 'monospace' }}>
                          +{formatNumber(estimatedProfit)} aUEC
                        </div>
                        <div style={{ fontSize: '10px', color: COLORS.greenOlive, fontFamily: 'monospace' }}>
                          {profitPercentage > 0 ? '+' : ''}{profitPercentage.toFixed(1)}% profit
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedInventoryId || quantity <= 0 || unitPrice <= 0}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '16px',
                background: submitting || !selectedInventoryId || quantity <= 0 || unitPrice <= 0
                  ? COLORS.bgLight
                  : `linear-gradient(135deg, ${COLORS.greenOlive} 0%, ${COLORS.greenOliveLight} 100%)`,
                border: `1px solid ${submitting ? COLORS.bgLight : COLORS.greenOlive}`,
                borderRadius: '2px',
                color: submitting || !selectedInventoryId || quantity <= 0 || unitPrice <= 0 ? COLORS.textTertiary : COLORS.bgDark,
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: submitting || !selectedInventoryId || quantity <= 0 || unitPrice <= 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: submitting || !selectedInventoryId || quantity <= 0 || unitPrice <= 0 ? 'none' : `0 0 20px ${COLORS.greenOlive}40`,
                transition: 'all 0.2s ease'
              }}
            >
              <DollarSign size={16} />
              RECORD SALE
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.bgDark}f8 0%, ${COLORS.bgMedium}f8 100%)`,
            border: `2px solid ${COLORS.greenOlive}`,
            borderRadius: '4px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
            boxShadow: `0 0 40px ${COLORS.greenOlive}40`,
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
            animation: 'slideIn 0.3s ease'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: COLORS.textTertiary,
                cursor: 'pointer',
                padding: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.red}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.textTertiary}
            >
              <X size={24} />
            </button>

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <AlertCircle style={{ width: '32px', height: '32px', color: COLORS.greenOlive }} />
              <h2 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: COLORS.greenOlive,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'monospace'
              }}>
                CONFIRM SALE
              </h2>
            </div>

            {/* Details */}
            <div style={{
              padding: '20px',
              background: `${COLORS.bgDark}80`,
              border: `1px solid ${COLORS.bgLight}`,
              borderRadius: '2px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '10px',
                  color: COLORS.textSecondary,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  fontFamily: 'monospace'
                }}>
                  Material
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                  fontFamily: 'monospace'
                }}>
                  {selectedItem?.material_name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                    Quantity
                  </div>
                  <div style={{ fontSize: '16px', color: COLORS.orange, fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatNumber(quantity)} {selectedItem?.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: COLORS.textSecondary, fontFamily: 'monospace' }}>
                    Unit Price
                  </div>
                  <div style={{ fontSize: '16px', color: COLORS.greenOlive, fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatNumber(unitPrice)} aUEC
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: `1px solid ${COLORS.bgLight}`,
                paddingTop: '12px',
                marginTop: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 700, fontFamily: 'monospace' }}>
                    Total Revenue:
                  </span>
                  <span style={{ fontSize: '20px', color: COLORS.greenOlive, fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatNumber(totalRevenue)} aUEC
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: COLORS.bgLight,
                  border: `1px solid ${COLORS.textTertiary}`,
                  borderRadius: '2px',
                  color: COLORS.textSecondary,
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = COLORS.bgMedium;
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.background = COLORS.bgLight;
                }}
              >
                CANCEL
              </button>

              <button
                onClick={confirmSale}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: submitting
                    ? COLORS.bgLight
                    : `linear-gradient(135deg, ${COLORS.greenOlive} 0%, ${COLORS.greenOliveLight} 100%)`,
                  border: `1px solid ${submitting ? COLORS.bgLight : COLORS.greenOlive}`,
                  borderRadius: '2px',
                  color: submitting ? COLORS.textTertiary : COLORS.bgDark,
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: submitting ? 'none' : `0 0 20px ${COLORS.greenOlive}40`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.boxShadow = `0 0 30px ${COLORS.greenOlive}60`;
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.boxShadow = `0 0 20px ${COLORS.greenOlive}40`;
                }}
              >
                {submitting ? (
                  <>PROCESSING...</>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    CONFIRM SALE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}