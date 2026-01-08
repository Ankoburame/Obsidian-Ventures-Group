"use client";

import { useEffect, useState } from "react";
import { Package, Activity, DollarSign, Clock, TrendingUp, Zap } from "lucide-react";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


interface DashboardData {
    stock_total: number;
    estimated_stock_value: number;
    active_refining: number;
    refining_history: Array<{
        id: number;
        material: string;
        quantity: number;
        ended_at: string;
    }>;
}

interface RefiningJob {
    id: number;
    refinery_name: string;
    refinery_system: string;
    job_type: string;
    total_cost: number;
    processing_time: number;
    status: string;
    start_time: string;
    end_time: string;
    seconds_remaining: number;      // ✅ Nouveau nom
    progress_percentage: number;    // ✅ Nouveau nom
    materials: Array<{
        id: number;
        material_id: number;
        material_name: string;
        quantity_refined: number;
        unit: string;
    }>;
    notes?: string;
}

function formatNumber(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)} K`;
    return value.toLocaleString();
}

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [jobs, setJobs] = useState<RefiningJob[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        async function loadData() {
            try {

                // Charger les stats globales du dashboard (tous les users)
                const dashboardRes = await fetch(`${API_URL}/dashboard/stats`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const dashboardData = await dashboardRes.json();

                // Charger les jobs de l'utilisateur connecté
                const userJobsRes = await fetch(`${API_URL}/production/jobs?status=processing`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const userJobsData = await userJobsRes.json();

                // Mettre à jour les états
                setJobs(Array.isArray(userJobsData) ? userJobsData : []);

                setDashboard({
                    stock_total: dashboardData.stock_total || 0,
                    estimated_stock_value: dashboardData.estimated_stock_value || 0,
                    active_refining: dashboardData.active_refining || 0,
                    refining_history: dashboardData.refining_history || []
                });

            } catch (e) {
                console.error("Error loading dashboard:", e);
                // Fallback en cas d'erreur totale
                setDashboard({
                    stock_total: 0,
                    estimated_stock_value: 0,
                    active_refining: 0,
                    refining_history: []
                });
            }
        }

        loadData();
        const timer = setInterval(loadData, 5000);
        return () => clearInterval(timer);
    }, [mounted]);

    if (!mounted || !dashboard) {
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
                    INITIALISATION DU SYSTÈME...
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px' }}>
            {/* HEADER FUTURISTE */}
            <div style={{
                marginBottom: '40px',
                position: 'relative',
                paddingBottom: '20px'
            }}>
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '4px',
                    height: '100%',
                    background: 'linear-gradient(180deg, #06b6d4 0%, transparent 100%)'
                }} />

                <div style={{ paddingLeft: '24px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                    }}>
                        <Zap style={{ width: '28px', height: '28px', color: '#06b6d4' }} />
                        <h1 style={{
                            fontSize: '36px',
                            fontWeight: 700,
                            color: 'white',
                            letterSpacing: '4px',
                            textTransform: 'uppercase',
                            margin: 0
                        }}>
                            TABLEAU DE BORD
                        </h1>
                    </div>
                    <div style={{
                        color: '#71717a',
                        fontSize: '13px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase'
                    }}>
            // SYSTÈME DE GESTION DES RESSOURCES
                    </div>
                </div>

                {/* Ligne de séparation tech */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, #06b6d4 0%, transparent 50%, #06b6d4 100%)',
                    opacity: 0.3
                }} />
            </div>

            {/* STATS EN UNE LIGNE */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '48px'
            }}>
                {/* STOCK */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}>
                    {/* Coin lumineux */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#71717a',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}>
                                STOCK TOTAL
                            </div>
                            <Package style={{ width: '20px', height: '20px', color: '#06b6d4', opacity: 0.6 }} />
                        </div>

                        <div style={{
                            fontSize: '42px',
                            fontWeight: 700,
                            color: 'white',
                            lineHeight: 1,
                            marginBottom: '8px',
                            fontFamily: 'monospace'
                        }}>
                            {dashboard.stock_total.toLocaleString()}
                        </div>

                        <div style={{
                            fontSize: '13px',
                            color: '#06b6d4',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                            SCU
                        </div>
                    </div>
                </div>

                {/* RAFFINAGES ACTIFS */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '8px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#71717a',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}>
                                RAFFINAGES ACTIFS
                            </div>
                            <Activity style={{ width: '20px', height: '20px', color: '#06b6d4', opacity: 0.6 }} />
                        </div>

                        <div style={{
                            fontSize: '42px',
                            fontWeight: 700,
                            color: 'white',
                            lineHeight: 1,
                            marginBottom: '8px',
                            fontFamily: 'monospace'
                        }}>
                            {dashboard.active_refining}
                        </div>

                        <div style={{
                            fontSize: '13px',
                            color: '#06b6d4',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                            EN COURS
                        </div>
                    </div>
                </div>

                {/* VALEUR ESTIMÉE */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
                    border: '2px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: '8px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '120px',
                        height: '120px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)'
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#71717a',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                fontWeight: 600
                            }}>
                                VALEUR ESTIMÉE
                            </div>
                            <DollarSign style={{ width: '20px', height: '20px', color: '#06b6d4' }} />
                        </div>

                        <div style={{
                            fontSize: '42px',
                            fontWeight: 700,
                            color: '#06b6d4',
                            lineHeight: 1,
                            marginBottom: '8px',
                            fontFamily: 'monospace',
                            textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
                        }}>
                            {formatNumber(dashboard.estimated_stock_value)}
                        </div>

                        <div style={{
                            fontSize: '13px',
                            color: '#06b6d4',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            opacity: 0.8
                        }}>
                            aUEC
                        </div>

                        <div style={{
                            fontSize: '10px',
                            color: '#52525b',
                            marginTop: '8px',
                            fontFamily: 'monospace'
                        }}>
                            {dashboard.estimated_stock_value.toLocaleString()} aUEC
                        </div>
                    </div>
                </div>
            </div>

            {/* RAFFINAGES EN COURS */}
            <div style={{ marginBottom: '48px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <Activity style={{ width: '24px', height: '24px', color: '#06b6d4' }} />
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        margin: 0
                    }}>
                        RAFFINAGES EN COURS
                    </h2>
                </div>

                {jobs.length === 0 ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px dashed rgba(82, 82, 91, 0.5)',
                        borderRadius: '8px',
                        padding: '60px 40px',
                        textAlign: 'center'
                    }}>
                        <Activity style={{
                            width: '48px',
                            height: '48px',
                            color: '#3f3f46',
                            marginBottom: '16px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }} />
                        <div style={{ color: '#71717a', fontSize: '14px', letterSpacing: '1px' }}>
                            AUCUN RAFFINAGE EN COURS
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {jobs.map((job) => {
                            const progress = job.progress_percentage || 0;

                            const etaMin = Math.ceil(job.seconds_remaining / 60);

                            return (
                                <div
                                    key={job.id}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, rgba(0, 0, 0, 0.4) 100%)',
                                        border: '1px solid rgba(6, 182, 212, 0.2)',
                                        borderRadius: '8px',
                                        padding: '24px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Glow effect */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '3px',
                                        height: '100%',
                                        background: 'linear-gradient(180deg, #06b6d4 0%, transparent 100%)'
                                    }} />

                                    {/* Header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: '#06b6d4',
                                                boxShadow: '0 0 10px #06b6d4',
                                                animation: 'pulse 2s ease-in-out infinite'
                                            }} />
                                            <div>
                                                <div style={{
                                                    fontSize: '20px',
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    marginBottom: '4px'
                                                }}>
                                                    {job.materials[0]?.material_name || 'N/A'}
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#71717a',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {job.materials[0]?.quantity_refined || 0} SCU
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                justifyContent: 'flex-end',
                                                marginBottom: '4px'
                                            }}>
                                                <Clock style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                                                <span style={{
                                                    fontSize: '18px',
                                                    fontWeight: 600,
                                                    color: '#06b6d4',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {etaMin} MIN
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#52525b',
                                                fontFamily: 'monospace'
                                            }}>
                                                {(() => {
                                                    const endTime = new Date(job.end_time);
                                                    const now = new Date();
                                                    const remainingMs = endTime.getTime() - now.getTime();
                                                    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
                                                    return remainingSeconds;
                                                })()}s restantess restantes
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar Futuriste */}
                                    <div style={{
                                        position: 'relative',
                                        height: '12px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(6, 182, 212, 0.2)'
                                    }}>
                                        {/* Background grid pattern */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(6, 182, 212, 0.05) 10px, rgba(6, 182, 212, 0.05) 11px)'
                                        }} />

                                        {/* Progress fill */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${Math.max(0, Math.min(100, progress))}%`,
                                            background: 'linear-gradient(90deg, #0891b2 0%, #06b6d4 50%, #0891b2 100%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 2s linear infinite',
                                            boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), inset 0 0 10px rgba(6, 182, 212, 0.3)',
                                            transition: 'width 1s ease-out'
                                        }} />

                                        {/* Scan line effect */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                                            backgroundSize: '50% 100%',
                                            animation: 'scan 3s linear infinite'
                                        }} />
                                    </div>

                                    {/* Progress percentage */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '12px'
                                    }}>
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#52525b',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase'
                                        }}>
                                            PROGRESSION
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#06b6d4',
                                            fontFamily: 'monospace'
                                        }}>
                                            {progress.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* HISTORIQUE */}
            <div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <TrendingUp style={{ width: '24px', height: '24px', color: '#06b6d4' }} />
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        margin: 0
                    }}>
                        HISTORIQUE
                    </h2>
                    <span style={{
                        fontSize: '12px',
                        color: '#52525b',
                        letterSpacing: '1px'
                    }}>
            // 7 DERNIERS JOURS
                    </span>
                </div>

                {dashboard.refining_history.length === 0 ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px dashed rgba(82, 82, 91, 0.5)',
                        borderRadius: '8px',
                        padding: '60px 40px',
                        textAlign: 'center'
                    }}>
                        <TrendingUp style={{
                            width: '48px',
                            height: '48px',
                            color: '#3f3f46',
                            marginBottom: '16px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }} />
                        <div style={{ color: '#71717a', fontSize: '14px', letterSpacing: '1px' }}>
                            AUCUN HISTORIQUE
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dashboard.refining_history.slice(0, 5).map((job, idx) => (
                            <div
                                key={`history-${job.id}-${idx}`}
                                style={{
                                    background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                                    border: '1px solid rgba(82, 82, 91, 0.3)',
                                    borderRadius: '6px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        boxShadow: '0 0 8px #10b981'
                                    }} />
                                    <span style={{
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: 'white'
                                    }}>
                                        {job.material}
                                    </span>
                                    <span style={{
                                        fontSize: '13px',
                                        color: '#71717a',
                                        fontFamily: 'monospace'
                                    }}>
                                        {job.quantity} SCU
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#52525b',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.5px'
                                }}>
                                    {new Date(job.ended_at).toLocaleString("fr-FR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
}