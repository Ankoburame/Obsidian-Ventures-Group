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
        materials: Array<{
            name: string;
            quantity: number;
        }>;
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
    seconds_remaining: number;
    progress_percentage: number;
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

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
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
                const dashboardRes = await fetch(`${API_URL}/dashboard/stats`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const dashboardData = await dashboardRes.json();

                const userJobsRes = await fetch(`${API_URL}/production/jobs?status=processing`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const userJobsData = await userJobsRes.json();

                setJobs(Array.isArray(userJobsData) ? userJobsData : []);
                setDashboard({
                    stock_total: dashboardData.stock_total || 0,
                    estimated_stock_value: dashboardData.estimated_stock_value || 0,
                    active_refining: dashboardData.active_refining || 0,
                    refining_history: dashboardData.refining_history || []
                });

            } catch (e) {
                console.error("Error loading dashboard:", e);
                setDashboard({
                    stock_total: 0,
                    estimated_stock_value: 0,
                    active_refining: 0,
                    refining_history: []
                });
            }
        }

        loadData();
        const dataInterval = setInterval(loadData, 30000);
        return () => clearInterval(dataInterval);
    }, [mounted]);

    // Update progress bars every second
    useEffect(() => {
        if (!mounted) return;

        const progressInterval = setInterval(() => {
            setJobs(prevJobs => {
                if (prevJobs.length === 0) return prevJobs;
                
                return prevJobs.map(job => {
                    if (job.status !== 'processing') return job;

                    const secondsRemaining = job.seconds_remaining - 1;
                    
                    if (secondsRemaining <= 0) {
                        return {
                            ...job,
                            seconds_remaining: 0,
                            progress_percentage: 100
                        };
                    }

                    const totalSeconds = job.processing_time * 60;
                    const elapsedSeconds = totalSeconds - secondsRemaining;
                    const progress = (elapsedSeconds / totalSeconds) * 100;

                    return {
                        ...job,
                        seconds_remaining: secondsRemaining,
                        progress_percentage: Math.min(100, Math.max(0, progress))
                    };
                });
            });
        }, 1000);

        return () => clearInterval(progressInterval);
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
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            padding: '32px',
            minHeight: '100vh'
        }}>
            {/* HEADER */}
            <div style={{
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
            }}>
                <h1 style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#52525b',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    margin: 0,
                    marginBottom: '8px'
                }}>
                    // SYSTÈME DE GESTION DES RESSOURCES
                </h1>
            </div>

            {/* KPI CARDS */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
                marginBottom: '48px'
            }}>
                {/* STOCK TOTAL */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '11px',
                            color: '#71717a',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontWeight: 600
                        }}>
                            STOCK TOTAL
                        </span>
                        <Package style={{ width: '20px', height: '20px', color: '#06b6d4', animation: 'pulse 3s ease-in-out infinite' }} />
                    </div>
                    
                    <div style={{
                        fontSize: '42px',
                        fontWeight: 700,
                        color: 'white',
                        fontFamily: 'monospace',
                        marginBottom: '8px'
                    }}>
                        {Math.round(dashboard.stock_total)}
                    </div>
                    
                    <div style={{
                        fontSize: '13px',
                        color: '#06b6d4',
                        letterSpacing: '1px',
                        fontWeight: 600
                    }}>
                        SCU
                    </div>
                </div>

                {/* RAFFINAGES ACTIFS */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '11px',
                            color: '#71717a',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontWeight: 600
                        }}>
                            RAFFINAGES ACTIFS
                        </span>
                        <Activity style={{ width: '20px', height: '20px', color: '#06b6d4', animation: 'pulse 3s ease-in-out infinite' }} />
                    </div>
                    
                    <div style={{
                        fontSize: '42px',
                        fontWeight: 700,
                        color: 'white',
                        fontFamily: 'monospace',
                        marginBottom: '8px'
                    }}>
                        {dashboard.active_refining}
                    </div>
                    
                    <div style={{
                        fontSize: '13px',
                        color: '#06b6d4',
                        letterSpacing: '1px',
                        fontWeight: 600
                    }}>
                        EN COURS
                    </div>
                </div>

                {/* VALEUR ESTIMÉE */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '8px',
                        padding: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-10%',
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '11px',
                            color: '#71717a',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            fontWeight: 600
                        }}>
                            VALEUR ESTIMÉE
                        </span>
                        <DollarSign style={{ width: '20px', height: '20px', color: '#06b6d4', animation: 'pulse 3s ease-in-out infinite' }} />
                    </div>
                    
                    <div style={{
                        fontSize: '42px',
                        fontWeight: 700,
                        color: 'white',
                        fontFamily: 'monospace',
                        marginBottom: '8px'
                    }}>
                        {formatNumber(dashboard.estimated_stock_value)}
                    </div>
                    
                    <div style={{
                        fontSize: '13px',
                        color: '#06b6d4',
                        letterSpacing: '1px',
                        fontWeight: 600
                    }}>
                        AUEC
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
                    <Zap style={{ width: '24px', height: '24px', color: '#06b6d4' }} />
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
                            margin: '0 auto 16px'
                        }} />
                        <div style={{ color: '#71717a', fontSize: '14px', letterSpacing: '1px' }}>
                            AUCUN RAFFINAGE EN COURS
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                style={{
                                    background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: 'white',
                                            margin: 0,
                                            marginBottom: '4px'
                                        }}>
                                            {job.materials.map(m => m.material_name).join(", ")}
                                        </h3>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#71717a',
                                            fontFamily: 'monospace'
                                        }}>
                                            {job.materials.map(m => `${m.quantity_refined} cSCU`).join(" • ")}
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        border: '1px solid rgba(6, 182, 212, 0.3)',
                                        borderRadius: '6px'
                                    }}>
                                        <Clock style={{ width: '16px', height: '16px', color: '#06b6d4' }} />
                                        <span style={{
                                            fontSize: '13px',
                                            color: '#06b6d4',
                                            fontWeight: 600,
                                            fontFamily: 'monospace'
                                        }}>
                                            {formatTime(job.seconds_remaining)}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    borderRadius: '4px',
                                    height: '8px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: `${job.progress_percentage}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
                                        boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)',
                                        transition: 'width 1s ease',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '40px',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3))',
                                            animation: 'shimmer 2s infinite'
                                        }} />
                                    </div>
                                </div>

                                {/* Progress Text */}
                                <div style={{
                                    marginTop: '12px',
                                    fontSize: '11px',
                                    color: '#52525b',
                                    letterSpacing: '1px',
                                    fontFamily: 'monospace',
                                    textTransform: 'uppercase'
                                }}>
                                    PROGRESSION: {job.progress_percentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
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
                            margin: '0 auto 16px'
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
                                    padding: '14px 18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(6, 182, 212, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(82, 82, 91, 0.3)';
                                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#10b981',
                                        boxShadow: '0 0 8px #10b981',
                                        flexShrink: 0
                                    }} />
                                    
                                    <div style={{ flex: 1 }}>
                                        {job.materials.length === 1 ? (
                                            /* Un seul matériau */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: 'white'
                                                }}>
                                                    {job.materials[0].name}
                                                </span>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#71717a',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {job.materials[0].quantity} SCU
                                                </span>
                                            </div>
                                        ) : (
                                            /* Plusieurs matériaux - format compact */
                                            <div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    marginBottom: '4px'
                                                }}>
                                                    {job.materials.length} matériaux raffinés
                                                </div>
                                                <div style={{
                                                    fontSize: '11px',
                                                    color: '#71717a',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    {job.materials.map(m => `${m.name} (${m.quantity})`).join(" • ")}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{
                                    fontSize: '11px',
                                    color: '#52525b',
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.5px',
                                    flexShrink: 0,
                                    marginLeft: '16px'
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

            {/* STYLES */}
            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}