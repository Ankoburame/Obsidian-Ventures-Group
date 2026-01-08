"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  DollarSign,
  ArrowLeft,
  Package,
  Activity
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Material {
  id: number;
  name: string;
  code?: string;
  category: string;
  avg_sell_price: number | null;
  min_buy_price: number | null;
  max_sell_price: number | null;
  best_buy_location: Location | null;
  best_sell_location: Location | null;
  available_at: number;
}

interface Location {
  id: number;
  name: string;
  code: string;
  system: string;
  full_path: string;
}

function generateMiniChartData(variation: number): number[] {
  const baseValue = 100;
  const points = 40;
  const data: number[] = [];

  let current = baseValue;
  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * 5;
    const trend = (variation / points) * i;
    current = baseValue + trend + noise;
    data.push(current);
  }

  return data;
}

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id;

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [variation] = useState((Math.random() - 0.5) * 10);

  useEffect(() => {
    async function loadMaterial() {
      try {
        const res = await fetch(`${API_URL}/market/materials/${materialId}`);
        const data = await res.json();

        // Le backend retourne { material: {...}, prices: [...] }
        // On a besoin juste de "material"
        const materialData = data.material || data;

        setMaterial(materialData);
        setLoading(false);
      } catch (e) {
        console.error("Error loading material:", e);
        setLoading(false);
      }
    }

    if (materialId) {
      loadMaterial();
    }
  }, [materialId]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid transparent',
          borderTopColor: '#06b6d4',
          borderRightColor: '#06b6d4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{
          color: '#52525b',
          fontSize: '14px',
          letterSpacing: '3px',
          fontWeight: 600
        }}>
          CHARGEMENT...
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!material) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ color: '#71717a', fontSize: '18px' }}>Matériau non trouvé</div>
        <button
          onClick={() => router.push('/market')}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid #06b6d4',
            borderRadius: '6px',
            color: '#06b6d4',
            cursor: 'pointer'
          }}
        >
          Retour au marché
        </button>
      </div>
    );
  }

  const chartData = generateMiniChartData(variation);

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* BOUTON RETOUR */}
      <button
        onClick={() => router.push('/market')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '6px',
          color: '#06b6d4',
          fontSize: '13px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          cursor: 'pointer',
          marginBottom: '32px',
          fontFamily: 'monospace',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
        }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        RETOUR AU MARCHÉ
      </button>

      {/* HEADER */}
      <div style={{
        marginBottom: '40px',
        position: 'relative',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              {material.category}
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              margin: 0,
              marginBottom: '8px',
              fontFamily: 'monospace'
            }}>
              {material.name}
            </h1>
            <div style={{
              fontSize: '14px',
              color: '#52525b',
              fontFamily: 'monospace'
            }}>
              CODE: {material.code}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '20px 28px',
            background: variation > 1
              ? 'rgba(16, 185, 129, 0.1)'
              : variation < -1
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(113, 113, 122, 0.1)',
            border: `2px solid ${variation > 1
                ? '#10b981'
                : variation < -1
                  ? '#ef4444'
                  : '#71717a'
              }`,
            borderRadius: '8px'
          }}>
            {variation > 1 ? (
              <TrendingUp style={{ width: '32px', height: '32px', color: '#10b981' }} />
            ) : variation < -1 ? (
              <TrendingDown style={{ width: '32px', height: '32px', color: '#ef4444' }} />
            ) : (
              <Minus style={{ width: '32px', height: '32px', color: '#71717a' }} />
            )}
            <div style={{
              fontSize: '36px',
              fontWeight: 700,
              color: variation > 1
                ? '#10b981'
                : variation < -1
                  ? '#ef4444'
                  : '#71717a',
              fontFamily: 'monospace'
            }}>
              {variation > 0 ? '+' : ''}{variation.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '8px',
        padding: '32px',
        marginBottom: '40px',
        height: '300px'
      }}>
        <svg width="100%" height="250" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{
                stopColor: variation > 1 ? '#10b981' : variation < -1 ? '#ef4444' : '#06b6d4',
                stopOpacity: 0.4
              }} />
              <stop offset="100%" style={{
                stopColor: variation > 1 ? '#10b981' : variation < -1 ? '#ef4444' : '#06b6d4',
                stopOpacity: 0
              }} />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4, 5].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 50}
              x2="100%"
              y2={i * 50}
              stroke="rgba(6, 182, 212, 0.1)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {(() => {
            const max = Math.max(...chartData);
            const min = Math.min(...chartData);
            const range = max - min || 1;
            const width = 1200;

            const points = chartData.map((value, i) => {
              const x = (i / (chartData.length - 1)) * width;
              const y = 250 - ((value - min) / range) * 230;
              return `${x},${y}`;
            }).join(" ");

            const color = variation > 1 ? '#10b981' : variation < -1 ? '#ef4444' : '#06b6d4';

            return (
              <>
                <path
                  d={`M 0,250 L ${points} L ${width},250 Z`}
                  fill="url(#chartGradient)"
                />

                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                />
              </>
            );
          })()}
        </svg>
      </div>

      {/* PRIX */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }}>
        {/* ACHAT */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <DollarSign style={{ width: '24px', height: '24px', color: '#ef4444' }} />
            <div style={{
              fontSize: '14px',
              color: '#71717a',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}>
              MEILLEUR PRIX D'ACHAT
            </div>
          </div>

          {material.min_buy_price ? (
            <>
              <div style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#ef4444',
                fontFamily: 'monospace',
                marginBottom: '16px',
                textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
              }}>
                {material.min_buy_price.toLocaleString()}
                <span style={{ fontSize: '20px', marginLeft: '12px', color: '#71717a' }}>
                  aUEC
                </span>
              </div>

              {material.best_buy_location && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#71717a', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                      {material.best_buy_location.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#52525b', fontFamily: 'monospace' }}>
                      {material.best_buy_location.full_path}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#3f3f46',
              fontFamily: 'monospace'
            }}>
              DONNÉES NON DISPONIBLES
            </div>
          )}
        </div>

        {/* VENTE */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <DollarSign style={{ width: '24px', height: '24px', color: '#10b981' }} />
            <div style={{
              fontSize: '14px',
              color: '#71717a',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              fontFamily: 'monospace'
            }}>
              MEILLEUR PRIX DE VENTE
            </div>
          </div>

          {material.max_sell_price ? (
            <>
              <div style={{
                fontSize: '48px',
                fontWeight: 700,
                color: '#10b981',
                fontFamily: 'monospace',
                marginBottom: '16px',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
              }}>
                {material.max_sell_price.toLocaleString()}
                <span style={{ fontSize: '20px', marginLeft: '12px', color: '#71717a' }}>
                  aUEC
                </span>
              </div>

              {material.best_sell_location && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <MapPin style={{ width: '20px', height: '20px', color: '#71717a', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                      {material.best_sell_location.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#52525b', fontFamily: 'monospace' }}>
                      {material.best_sell_location.full_path}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#3f3f46',
              fontFamily: 'monospace'
            }}>
              DONNÉES NON DISPONIBLES
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <div style={{
        marginTop: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <div style={{
          padding: '20px',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '6px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#71717a',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}>
            PRIX MOYEN
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#06b6d4',
            fontFamily: 'monospace'
          }}>
            {material.avg_sell_price?.toLocaleString() || '--'}
            <span style={{ fontSize: '14px', marginLeft: '8px', color: '#52525b' }}>
              aUEC
            </span>
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '6px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#71717a',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}>
            DISPONIBILITÉ
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#06b6d4',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Package style={{ width: '24px', height: '24px' }} />
            {material.available_at}
            <span style={{ fontSize: '14px', color: '#52525b' }}>
              LOCATIONS
            </span>
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '6px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#71717a',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}>
            MARGE POTENTIELLE
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: material.max_sell_price && material.min_buy_price
              ? '#10b981'
              : '#52525b',
            fontFamily: 'monospace'
          }}>
            {material.max_sell_price && material.min_buy_price
              ? ((material.max_sell_price - material.min_buy_price) / material.min_buy_price * 100).toFixed(1)
              : '--'}
            <span style={{ fontSize: '14px', marginLeft: '8px' }}>
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}