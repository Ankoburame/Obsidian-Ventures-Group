"use client";

import React, { useState, useEffect } from 'react';
import { Filter, X, Search } from 'lucide-react';

const COLORS = {
  cyan: "#06b6d4",
  magenta: "#ec4899",
  orange: "#f97316",
  lime: "#84cc16",
  yellow: "#fbbf24",
  red: "#ef4444",
  bgDark: "#0a0e1a",
  bgMedium: "#151b2e",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
};

interface Location {
  name: string;
  type: string;
  gravity_well: string;
  materials: Record<string, number>;
}

export default function MiningSpots() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedGravityWell, setSelectedGravityWell] = useState<string>('all');
  const [searchMaterial, setSearchMaterial] = useState<string>('');
  const [allMaterials, setAllMaterials] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/mining_spot.json');
        const data = await res.json();
        setLocations(data.locations);
        setFilteredLocations(data.locations);

        const firstLocation = data.locations[0];
        if (firstLocation) {
          const materialsInOrder = Object.keys(firstLocation.materials);
          setAllMaterials(materialsInOrder);
        }
      } catch (e) {
        console.error('Failed to load mining data:', e);
      }
    }

    if (mounted) {
      loadData();
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    let filtered = locations;

    if (selectedGravityWell !== 'all') {
      filtered = filtered.filter(loc => loc.gravity_well === selectedGravityWell);
    }

    if (searchMaterial) {
      filtered = filtered.filter(loc => {
        return Object.keys(loc.materials).some(mat =>
          mat.toLowerCase().includes(searchMaterial.toLowerCase()) &&
          loc.materials[mat] > 0
        );
      });
    }

    setFilteredLocations(filtered);
  }, [selectedGravityWell, searchMaterial, locations, mounted]);

  if (!mounted) return null;

  const gravityWells = Array.from(new Set(locations.map(l => l.gravity_well)));

  const getHeatColor = (value: number) => {
    if (value === 0) return COLORS.bgMedium;
    if (value < 10) return `${COLORS.orange}50`;
    if (value < 30) return `${COLORS.yellow}60`;
    if (value < 50) return `${COLORS.lime}70`;
    return `${COLORS.cyan}80`;
  };

  const getTextColor = (value: number) => {
    if (value === 0) return COLORS.textSecondary;
    if (value < 30) return COLORS.orange;
    if (value < 50) return COLORS.yellow;
    return COLORS.cyan;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at top, ${COLORS.bgMedium}, ${COLORS.bgDark})`,
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated particles */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.magenta : COLORS.orange,
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              opacity: 0.6,
              boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>

      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '12px',
            color: COLORS.cyan,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: '8px',
            fontFamily: 'monospace',
            textShadow: `0 0 10px ${COLORS.cyan}`
          }}>
            // REFERENCE DATABASE
          </div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 700,
            background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.magenta})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            margin: 0,
            fontFamily: 'monospace',
            filter: `drop-shadow(0 0 20px ${COLORS.cyan}60)`
          }}>
            MINING LOCATIONS
          </h1>
        </div>

        {/* Filters */}
        <div style={{
          background: `${COLORS.bgMedium}cc`,
          border: `1px solid ${COLORS.cyan}40`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 30px ${COLORS.cyan}20`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.cyan,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace',
              textShadow: `0 0 5px ${COLORS.cyan}`
            }}>
              <Filter size={12} style={{ display: 'inline', marginRight: '6px' }} />
              GRAVITY WELL
            </label>
            <select
              value={selectedGravityWell}
              onChange={(e) => setSelectedGravityWell(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: COLORS.bgDark,
                border: `2px solid ${COLORS.cyan}60`,
                borderRadius: '4px',
                color: COLORS.cyan,
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: `inset 0 0 10px ${COLORS.cyan}20`
              }}
            >
              <option value="all">ALL SYSTEMS</option>
              {gravityWells.map(gw => (
                <option key={gw} value={gw}>{gw}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: COLORS.magenta,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace',
              textShadow: `0 0 8px ${COLORS.magenta}, 0 0 15px ${COLORS.magenta}`
            }}>
              <Search size={12} style={{ display: 'inline', marginRight: '6px' }} />
              SEARCH MATERIAL
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchMaterial}
                onChange={(e) => setSearchMaterial(e.target.value)}
                placeholder="Quantanium, Gold..."
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  background: COLORS.bgDark,
                  border: `2px solid ${COLORS.magenta}`,
                  borderRadius: '4px',
                  color: COLORS.magenta,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: `inset 0 0 15px ${COLORS.magenta}40, 0 0 20px ${COLORS.magenta}30`
                }}
              />
              {searchMaterial && (
                <button
                  onClick={() => setSearchMaterial('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.magenta,
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: `${COLORS.bgMedium}cc`,
          border: `1px solid ${COLORS.cyan}40`,
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '65vh',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 0 40px ${COLORS.cyan}30`
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              background: COLORS.bgDark,
              zIndex: 10,
              boxShadow: `0 2px 10px ${COLORS.cyan}40`
            }}>
              <tr>
                <th style={{
                  padding: '16px 12px',
                  textAlign: 'left',
                  color: COLORS.cyan,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  position: 'sticky',
                  left: 0,
                  background: COLORS.bgDark,
                  zIndex: 11,
                  borderBottom: `2px solid ${COLORS.cyan}`,
                  textShadow: `0 0 10px ${COLORS.cyan}`
                }}>
                  LOCATION
                </th>
                {allMaterials.map(mat => (
                  <th key={mat} style={{
                    padding: '16px 8px',
                    textAlign: 'center',
                    color: COLORS.magenta,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '9px',
                    letterSpacing: '1px',
                    minWidth: '70px',
                    borderBottom: `2px solid ${COLORS.magenta}`,
                    textShadow: `0 0 8px ${COLORS.magenta}`
                  }}>
                    {mat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((loc, idx) => (
                <tr key={`${loc.name}-${idx}`} style={{
                  borderBottom: `1px solid ${COLORS.bgDark}`,
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.cyan}15`;
                    e.currentTarget.style.boxShadow = `inset 0 0 20px ${COLORS.cyan}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{
                    padding: '14px 12px',
                    color: COLORS.textPrimary,
                    fontWeight: 700,
                    position: 'sticky',
                    left: 0,
                    background: COLORS.bgMedium,
                    borderRight: `1px solid ${COLORS.cyan}30`,
                    textShadow: `0 0 5px ${COLORS.cyan}60`
                  }}>
                    <div>{loc.name}</div>
                    <div style={{
                      fontSize: '9px',
                      color: COLORS.textSecondary,
                      marginTop: '4px',
                      opacity: 0.7
                    }}>
                      {loc.gravity_well}
                    </div>
                  </td>
                  {allMaterials.map(mat => {
                    const value = loc.materials[mat] || 0;
                    return (
                      <td key={mat} style={{
                        padding: '10px 6px',
                        textAlign: 'center',
                        background: getHeatColor(value),
                        color: getTextColor(value),
                        fontSize: '10px',
                        fontWeight: value > 0 ? 700 : 400,
                        textShadow: value > 30 ? `0 0 10px ${getTextColor(value)}, 0 0 20px ${getTextColor(value)}` : 'none',
                        transition: 'all 0.2s'
                      }}>
                        {value > 0 ? `${value}%` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: `${COLORS.bgMedium}80`,
          border: `1px solid ${COLORS.cyan}40`,
          borderRadius: '8px',
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: '11px',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { label: '0%', color: COLORS.bgMedium },
            { label: '1-30%', color: `${COLORS.orange}50` },
            { label: '30-50%', color: `${COLORS.yellow}60` },
            { label: '50%+', color: `${COLORS.cyan}70` }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: item.color,
                border: `2px solid ${COLORS.cyan}60`,
                borderRadius: '4px',
                boxShadow: `0 0 10px ${item.color}`
              }} />
              <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
