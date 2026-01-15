// ============================================================
// COMPOSANT: Inventory Filters & Sort (CIG Style)
// ============================================================

import React, { useState } from "react";
import { Search, Filter, SortAsc, X } from "lucide-react";

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

interface InventoryItem {
    id: number;
    refinery_id: number;
    refinery_name: string;
    refinery_system: string;  // ← AJOUTER
    material_id: number;
    material_name: string;
    quantity: number;
    unit: string;  // ← AJOUTER
    estimated_unit_price: number;  // ← AJOUTER
    estimated_total_value: number;
    last_updated: string;
}

interface InventoryFiltersProps {
    inventory: InventoryItem[];
    onFilteredChange: (filtered: InventoryItem[]) => void;
}

export function InventoryFilters({ inventory, onFilteredChange }: InventoryFiltersProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRefinery, setSelectedRefinery] = useState<string>("all");
    const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("name-asc");

    // Get unique refineries and materials
    const refineries = Array.from(new Set(inventory.map(item => item.refinery_name))).sort();
    const materials = Array.from(new Set(inventory.map(item => item.material_name))).sort();

    // Apply filters and sort
    React.useEffect(() => {
        let filtered = [...inventory];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.material_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Refinery filter
        if (selectedRefinery !== "all") {
            filtered = filtered.filter(item => item.refinery_name === selectedRefinery);
        }

        // Material filter
        if (selectedMaterial !== "all") {
            filtered = filtered.filter(item => item.material_name === selectedMaterial);
        }

        // Sort
        switch (sortBy) {
            case "name-asc":
                filtered.sort((a, b) => a.material_name.localeCompare(b.material_name));
                break;
            case "name-desc":
                filtered.sort((a, b) => b.material_name.localeCompare(a.material_name));
                break;
            case "quantity-asc":
                filtered.sort((a, b) => a.quantity - b.quantity);
                break;
            case "quantity-desc":
                filtered.sort((a, b) => b.quantity - a.quantity);
                break;
            case "value-asc":
                filtered.sort((a, b) => a.estimated_total_value - b.estimated_total_value);
                break;
            case "value-desc":
                filtered.sort((a, b) => b.estimated_total_value - a.estimated_total_value);
                break;
            case "date-newest":
                filtered.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
                break;
            case "date-oldest":
                filtered.sort((a, b) => new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime());
                break;
        }

        onFilteredChange(filtered);
    }, [searchTerm, selectedRefinery, selectedMaterial, sortBy, inventory, onFilteredChange]);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedRefinery("all");
        setSelectedMaterial("all");
        setSortBy("name-asc");
    };

    const hasActiveFilters = searchTerm || selectedRefinery !== "all" || selectedMaterial !== "all" || sortBy !== "name-asc";

    return (
        <div style={{
            marginBottom: '24px',
            padding: '20px',
            background: `linear-gradient(135deg, ${COLORS.bgDark}f5 0%, ${COLORS.bgMedium}f5 100%)`,
            border: `1px solid ${COLORS.orange}40`,
            borderLeft: `3px solid ${COLORS.orange}`,
            borderRadius: '4px',
            position: 'relative'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Filter style={{ width: '16px', height: '16px', color: COLORS.orange }} />
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: COLORS.orange,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace'
                    }}>
            // FILTERS & SORT
                    </span>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        style={{
                            padding: '6px 12px',
                            background: `${COLORS.red}30`,
                            border: `1px solid ${COLORS.red}`,
                            borderRadius: '2px',
                            color: COLORS.red,
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${COLORS.red}50`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = `${COLORS.red}30`;
                        }}
                    >
                        <X size={12} />
                        RESET
                    </button>
                )}
            </div>

            {/* Filters Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
            }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '9px',
                        color: COLORS.textSecondary,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        fontFamily: 'monospace'
                    }}>
                        SEARCH
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Search style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '14px',
                            height: '14px',
                            color: COLORS.textTertiary,
                            pointerEvents: 'none'
                        }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Material name..."
                            style={{
                                width: '100%',
                                padding: '12px 10px',
                                background: COLORS.bgDark,
                                border: `1px solid ${COLORS.bgLight}`,
                                borderRadius: '2px',
                                color: COLORS.textPrimary,
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                cursor: 'pointer',
                                outline: 'none',
                                height: '40px',
                                lineHeight: '1',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                            onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                        />
                    </div>
                </div>

                {/* Refinery Filter */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '9px',
                        color: COLORS.textSecondary,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        fontFamily: 'monospace'
                    }}>
                        REFINERY
                    </label>
                    <select
                        value={selectedRefinery}
                        onChange={(e) => setSelectedRefinery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 10px',  // ← Plus de padding
                            background: COLORS.bgDark,
                            border: `1px solid ${COLORS.bgLight}`,
                            borderRadius: '2px',
                            color: COLORS.textPrimary,
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            outline: 'none',
                            height: '40px',  // ← AJOUTER hauteur fixe
                            lineHeight: '1'  // ← Line-height à 1
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    >
                        <option value="all">All Refineries</option>
                        {refineries.map(ref => (
                            <option key={`ref-${ref}`} value={ref}>{ref}</option>
                        ))}
                    </select>
                </div>

                {/* Material Filter */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '9px',
                        color: COLORS.textSecondary,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        fontFamily: 'monospace'
                    }}>
                        MATERIAL
                    </label>
                    <select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 10px',  // ← Plus de padding
                            background: COLORS.bgDark,
                            border: `1px solid ${COLORS.bgLight}`,
                            borderRadius: '2px',
                            color: COLORS.textPrimary,
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            outline: 'none',
                            height: '40px',  // ← AJOUTER hauteur fixe
                            lineHeight: '1'  // ← Line-height à 1
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    >
                        <option value="all">All Materials</option>
                        {materials.map(mat => (
                            <option key={mat} value={mat}>{mat}</option>
                        ))}
                    </select>
                </div>

                {/* Sort */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '9px',
                        color: COLORS.textSecondary,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        fontFamily: 'monospace'
                    }}>
                        <SortAsc style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
                        SORT BY
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 10px',  // ← Plus de padding
                            background: COLORS.bgDark,
                            border: `1px solid ${COLORS.bgLight}`,
                            borderRadius: '2px',
                            color: COLORS.textPrimary,
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            outline: 'none',
                            height: '40px',  // ← AJOUTER hauteur fixe
                            lineHeight: '1'  // ← Line-height à 1
                        }}
                        onFocus={(e) => e.target.style.borderColor = COLORS.orange}
                        onBlur={(e) => e.target.style.borderColor = COLORS.bgLight}
                    >
                        <option value="name-asc">Name (A → Z)</option>
                        <option value="name-desc">Name (Z → A)</option>
                        <option value="quantity-desc">Quantity (High → Low)</option>
                        <option value="quantity-asc">Quantity (Low → High)</option>
                        <option value="value-desc">Value (High → Low)</option>
                        <option value="value-asc">Value (Low → High)</option>
                        <option value="date-newest">Date (Newest First)</option>
                        <option value="date-oldest">Date (Oldest First)</option>
                    </select>
                </div>
            </div>

            {/* Active Filters Count */}
            {hasActiveFilters && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: `${COLORS.orange}15`,
                    border: `1px solid ${COLORS.orange}40`,
                    borderRadius: '2px',
                    fontSize: '10px',
                    color: COLORS.orange,
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                }}>
                    ✓ Filters active
                    {searchTerm && ` • Search: "${searchTerm}"`}
                    {selectedRefinery !== "all" && ` • Refinery: ${selectedRefinery}`}
                    {selectedMaterial !== "all" && ` • Material: ${selectedMaterial}`}
                </div>
            )}
        </div>
    );
}