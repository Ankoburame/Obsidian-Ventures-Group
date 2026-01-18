"use client";

import { useEffect, useState } from "react";
import { Ship, Plus, Trash2, Edit, RefreshCw, Loader2, Package, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ShipData {
    id: number;
    uex_id: number | null;
    name: string;
    manufacturer: string | null;
    role: string | null;
    cargo_capacity_scu: number | null;
    status: string;
    image_url: string | null;
    owner_id: number;
    created_at: string | null;
}

const STATUS_COLORS = {
    available: { bg: "rgba(16, 185, 129, 0.1)", border: "#10b981", text: "#10b981" },
    in_mission: { bg: "rgba(251, 191, 36, 0.1)", border: "#fbbf24", text: "#fbbf24" },
    maintenance: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", text: "#ef4444" },
};

export default function FleetPage() {
    const [ships, setShips] = useState<ShipData[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newShip, setNewShip] = useState({
        name: "",
        manufacturer: "",
        role: "",
        cargo_capacity_scu: 0,
    });

    useEffect(() => {
        loadShips();
    }, [filterStatus]);

    async function loadShips() {
        try {
            const url = filterStatus 
                ? `${API_URL}/fleet/ships?status=${filterStatus}`
                : `${API_URL}/fleet/ships`;
            
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setShips(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (e) {
            console.error("Error loading ships:", e);
            setLoading(false);
        }
    }

    async function syncFromUEX() {
        setSyncing(true);
        try {
            const res = await fetch(`${API_URL}/fleet/sync-uex`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            
            if (res.ok) {
                await loadShips();
                alert("Fleet synced successfully!");
            } else {
                alert("Sync failed. Check console for details.");
            }
        } catch (e) {
            console.error("Sync error:", e);
            alert("Sync failed. Check console for details.");
        }
        setSyncing(false);
    }

    async function addShip() {
        try {
            const res = await fetch(`${API_URL}/fleet/ships`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(newShip)
            });

            if (res.ok) {
                await loadShips();
                setShowAddForm(false);
                setNewShip({ name: "", manufacturer: "", role: "", cargo_capacity_scu: 0 });
            }
        } catch (e) {
            console.error("Error adding ship:", e);
        }
    }

    async function updateShipStatus(shipId: number, status: string) {
        try {
            await fetch(`${API_URL}/fleet/ships/${shipId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ status })
            });
            await loadShips();
        } catch (e) {
            console.error("Error updating ship:", e);
        }
    }

    async function deleteShip(shipId: number) {
        if (!confirm("Remove this ship from fleet?")) return;
        
        try {
            await fetch(`${API_URL}/fleet/ships/${shipId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            await loadShips();
        } catch (e) {
            console.error("Error deleting ship:", e);
        }
    }

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
                <Loader2 style={{ width: '48px', height: '48px', color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', minHeight: '100vh' }}>
            {/* HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#52525b',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        margin: 0,
                        marginBottom: '8px'
                    }}>
                        // FLEET MANAGEMENT
                    </h1>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '2px'
                    }}>
                        {ships.length} SHIP{ships.length !== 1 ? 'S' : ''}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                            border: '1px solid #06b6d4',
                            borderRadius: '6px',
                            color: '#06b6d4',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.15) 100%)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} />
                        ADD SHIP
                    </button>

                    <button
                        onClick={syncFromUEX}
                        disabled={syncing}
                        style={{
                            padding: '12px 24px',
                            background: syncing 
                                ? 'rgba(82, 82, 91, 0.2)'
                                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                            border: `1px solid ${syncing ? '#52525b' : '#10b981'}`,
                            borderRadius: '6px',
                            color: syncing ? '#71717a' : '#10b981',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: syncing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!syncing) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!syncing) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)';
                                e.currentTarget.style.boxShadow = 'none';
                            }
                        }}
                    >
                        <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                        {syncing ? 'SYNCING...' : 'SYNC UEX'}
                    </button>
                </div>
            </div>

            {/* ADD FORM */}
            {showAddForm && (
                <div style={{
                    marginBottom: '32px',
                    padding: '24px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px'
                }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'white',
                        marginBottom: '20px',
                        letterSpacing: '1px'
                    }}>
                        ADD NEW SHIP
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Ship Name"
                            value={newShip.name}
                            onChange={(e) => setNewShip({...newShip, name: e.target.value})}
                            style={{
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(82, 82, 91, 0.5)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Manufacturer"
                            value={newShip.manufacturer}
                            onChange={(e) => setNewShip({...newShip, manufacturer: e.target.value})}
                            style={{
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(82, 82, 91, 0.5)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Role"
                            value={newShip.role}
                            onChange={(e) => setNewShip({...newShip, role: e.target.value})}
                            style={{
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(82, 82, 91, 0.5)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Cargo Capacity (SCU)"
                            value={newShip.cargo_capacity_scu || ''}
                            onChange={(e) => setNewShip({...newShip, cargo_capacity_scu: Number(e.target.value)})}
                            style={{
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(82, 82, 91, 0.5)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    
                    <button
                        onClick={addShip}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ADD TO FLEET
                    </button>
                </div>
            )}

            {/* FILTERS */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {[
                    { value: null, label: 'ALL' },
                    { value: 'available', label: 'AVAILABLE' },
                    { value: 'in_mission', label: 'IN MISSION' },
                    { value: 'maintenance', label: 'MAINTENANCE' }
                ].map(filter => (
                    <button
                        key={filter.label}
                        onClick={() => setFilterStatus(filter.value)}
                        style={{
                            padding: '8px 16px',
                            background: filterStatus === filter.value
                                ? 'rgba(6, 182, 212, 0.2)'
                                : 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${filterStatus === filter.value ? '#06b6d4' : 'rgba(82, 82, 91, 0.5)'}`,
                            borderRadius: '6px',
                            color: filterStatus === filter.value ? '#06b6d4' : '#71717a',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* SHIPS GRID */}
            {ships.length === 0 ? (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px dashed rgba(82, 82, 91, 0.5)',
                    borderRadius: '8px',
                    padding: '60px 40px',
                    textAlign: 'center'
                }}>
                    <Ship style={{
                        width: '48px',
                        height: '48px',
                        color: '#3f3f46',
                        margin: '0 auto 16px'
                    }} />
                    <div style={{ color: '#71717a', fontSize: '14px', letterSpacing: '1px' }}>
                        NO SHIPS IN FLEET
                    </div>
                    <div style={{ color: '#52525b', fontSize: '12px', marginTop: '8px' }}>
                        Add ships manually or sync from UEX
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '24px'
                }}>
                    {ships.map(ship => {
                        const statusColor = STATUS_COLORS[ship.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.available;
                        
                        return (
                            <div
                                key={ship.id}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.15)';
                                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                                }}
                            >
                                {/* IMAGE */}
                                <div style={{
                                    width: '100%',
                                    height: '200px',
                                    background: ship.image_url 
                                        ? `url(${ship.image_url}) center/cover no-repeat, linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)`
                                        : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
                                }}>
                                    {!ship.image_url && (
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}>
                                            <Ship style={{ 
                                                width: '64px', 
                                                height: '64px', 
                                                color: '#06b6d4',
                                                opacity: 0.3,
                                                filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))'
                                            }} />
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#3f3f46',
                                                letterSpacing: '1px',
                                                textTransform: 'uppercase'
                                            }}>
                                                No Image Available
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* STATUS BADGE */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        padding: '6px 12px',
                                        background: statusColor.bg,
                                        border: `1px solid ${statusColor.border}`,
                                        borderRadius: '4px',
                                        color: statusColor.text,
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {ship.status.replace('_', ' ')}
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div style={{ padding: '20px' }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: 'white',
                                        margin: 0,
                                        marginBottom: '4px',
                                        letterSpacing: '1px'
                                    }}>
                                        {ship.name}
                                    </h3>
                                    
                                    {ship.manufacturer && (
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#71717a',
                                            marginBottom: '16px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {ship.manufacturer}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                        {ship.role && (
                                            <div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#52525b',
                                                    letterSpacing: '1px',
                                                    marginBottom: '4px'
                                                }}>
                                                    ROLE
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#06b6d4',
                                                    fontWeight: 600
                                                }}>
                                                    {ship.role}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {ship.cargo_capacity_scu !== null && (
                                            <div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#52525b',
                                                    letterSpacing: '1px',
                                                    marginBottom: '4px'
                                                }}>
                                                    CARGO
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#06b6d4',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Package size={14} />
                                                    {ship.cargo_capacity_scu} SCU
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <select
                                            value={ship.status}
                                            onChange={(e) => updateShipStatus(ship.id, e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                background: 'rgba(0, 0, 0, 0.6)',
                                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                                borderRadius: '4px',
                                                color: '#06b6d4',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="available" style={{ background: '#0a0e1a', color: '#06b6d4' }}>Available</option>
                                            <option value="in_mission" style={{ background: '#0a0e1a', color: '#fbbf24' }}>In Mission</option>
                                            <option value="maintenance" style={{ background: '#0a0e1a', color: '#ef4444' }}>Maintenance</option>
                                        </select>

                                        <button
                                            onClick={() => deleteShip(ship.id)}
                                            style={{
                                                padding: '8px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '4px',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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