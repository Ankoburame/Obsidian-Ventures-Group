"use client";

import { useEffect, useState } from "react";
import { Ship, Plus, Trash2, Loader2, Package, AlertCircle } from "lucide-react";

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
    owner_username: string | null;
    created_at: string | null;
}

interface ShipTemplate {
    id: string;
    name: string;
    manufacturer: string;
    role: string[];
    cost: number;
    cargo_scu: number;
    "max-crew": number;
    size: string;
    image_url: string;
    flight_ready: boolean;
}

const STATUS_COLORS = {
    available: { bg: "rgba(16, 185, 129, 0.1)", border: "#10b981", text: "#10b981" },
    in_mission: { bg: "rgba(251, 191, 36, 0.1)", border: "#fbbf24", text: "#fbbf24" },
    maintenance: { bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444", text: "#ef4444" },
};

const MANUFACTURERS = [
    { name: "Aegis Dynamics", logo: "/logo/Sc-logo-aegis.svg" },
    { name: "Anvil Aerospace", logo: "/logo/Sc-logo-anvil-aerospace.svg" },
    { name: "Aopoa", logo: "/logo/Sc-logo-aopoa.svg" },
    { name: "Argo Astronautics", logo: "/logo/Sc-logo-argo-astronautics.svg" },
    { name: "Banu", logo: "/logo/Sc-logo-banu.svg" },
    { name: "Consolidated Outland", logo: "/logo/Sc-logo-consolidated-outland.svg" },
    { name: "Crusader Industries", logo: "/logo/Sc-logo-crusader.svg" },
    { name: "Drake Interplanetary", logo: "/logo/Sc-logo-drake.svg" },
    { name: "Esperia", logo: "/logo/Sc-logo-esperia.svg" },
    { name: "Gatac Manufacture", logo: "/logo/Sc-logo-gatac.svg" },
    { name: "Kruger Intergalactic", logo: "/logo/Sc-logo-kruger.svg" },
    { name: "MISC", logo: "/logo/Sc-logo-misc.svg" },
    { name: "Origin Jumpworks", logo: "/logo/Sc-logo-origin.svg" },
    { name: "Roberts Space Industries", logo: "/logo/Sc-logo-rsi.svg" },
];

export default function FleetPage() {
    const [ships, setShips] = useState<ShipData[]>([]);
    const [shipTemplates, setShipTemplates] = useState<ShipTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [filterManufacturer, setFilterManufacturer] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchShip, setSearchShip] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<ShipTemplate | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        loadShipTemplates();
        loadShips();
        loadCurrentUser();
    }, [filterStatus, filterManufacturer]);

    async function loadCurrentUser() {
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setCurrentUserRole(data.role);
            setCurrentUserId(data.id);
        } catch (e) {
            console.error("Error loading user:", e);
        }
    }

    async function loadShipTemplates() {
        try {
            const res = await fetch("/ship_list.json");
            const data = await res.json();
            setShipTemplates(data);
        } catch (e) {
            console.error("Error loading ship templates:", e);
        }
    }

    async function loadShips() {
        try {
            let url = `${API_URL}/fleet/ships`;
            const params = new URLSearchParams();
            if (filterStatus) params.append("status", filterStatus);
            if (params.toString()) url += `?${params.toString()}`;
            
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            
            let filteredShips = Array.isArray(data) ? data : [];
            
            // Filter by manufacturer on frontend (since backend doesn't have this filter)
            if (filterManufacturer) {
                filteredShips = filteredShips.filter(s => s.manufacturer === filterManufacturer);
            }
            
            setShips(filteredShips);
            setLoading(false);
        } catch (e) {
            console.error("Error loading ships:", e);
            setLoading(false);
        }
    }

    async function addShip() {
        if (!selectedTemplate) return;
        
        try {
            const res = await fetch(`${API_URL}/fleet/ships`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    name: selectedTemplate.name,
                    manufacturer: selectedTemplate.manufacturer,
                    role: selectedTemplate.role.join(", "),
                    cargo_capacity_scu: selectedTemplate.cargo_scu,
                    image_url: selectedTemplate.image_url,
                    status: "available"
                })
            });

            if (res.ok) {
                await loadShips();
                setShowAddForm(false);
                setSearchShip("");
                setSelectedTemplate(null);
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
            const res = await fetch(`${API_URL}/fleet/ships/${shipId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            
            if (!res.ok) {
                const error = await res.json();
                alert(error.detail || "Failed to delete ship");
                return;
            }
            
            await loadShips();
        } catch (e) {
            console.error("Error deleting ship:", e);
        }
    }

    const filteredTemplates = shipTemplates
        .filter(t => t.flight_ready)
        .filter(t => t.name.toLowerCase().includes(searchShip.toLowerCase()));

    const canDeleteShip = (ship: ShipData) => {
        return currentUserRole === "admin" || currentUserRole === "officer" || ship.owner_id === currentUserId;
    };

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

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                        border: '1px solid #06b6d4',
                        borderRadius: '6px',
                        color: '#06b6d4',
                        fontSize: '12px',
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
                    <Plus size={14} />
                    ADD SHIP
                </button>
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
                    
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Search ship name..."
                            value={searchShip}
                            onChange={(e) => setSearchShip(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(82, 82, 91, 0.5)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '14px',
                                marginBottom: '12px'
                            }}
                        />
                        
                        {searchShip && filteredTemplates.length > 0 && (
                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: 'rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                borderRadius: '6px'
                            }}>
                                {filteredTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setSearchShip(template.name);
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid rgba(82, 82, 91, 0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
                                            {template.name}
                                        </div>
                                        <div style={{ color: '#71717a', fontSize: '12px', marginTop: '4px' }}>
                                            {template.manufacturer} • {template.role.join(", ")} • {template.cargo_scu} SCU
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedTemplate && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(6, 182, 212, 0.05)',
                            border: '1px solid rgba(6, 182, 212, 0.2)',
                            borderRadius: '6px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>
                                <strong>Selected:</strong> {selectedTemplate.name}
                            </div>
                            <div style={{ color: '#71717a', fontSize: '12px' }}>
                                {selectedTemplate.manufacturer} • {selectedTemplate.role.join(", ")} • {selectedTemplate.cargo_scu} SCU
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={addShip}
                        disabled={!selectedTemplate}
                        style={{
                            padding: '12px 24px',
                            background: selectedTemplate 
                                ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                                : 'rgba(82, 82, 91, 0.3)',
                            border: 'none',
                            borderRadius: '6px',
                            color: selectedTemplate ? 'white' : '#52525b',
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            cursor: selectedTemplate ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ADD TO FLEET
                    </button>
                </div>
            )}

            {/* MANUFACTURER FILTERS */}
            <div style={{
                marginBottom: '20px',
                overflowX: 'auto',
                display: 'flex',
                gap: '12px',
                paddingBottom: '8px'
            }}>
                <button
                    onClick={() => setFilterManufacturer(null)}
                    style={{
                        minWidth: '120px',
                        padding: '8px 16px',
                        background: !filterManufacturer
                            ? 'rgba(6, 182, 212, 0.2)'
                            : 'rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${!filterManufacturer ? '#06b6d4' : 'rgba(82, 82, 91, 0.5)'}`,
                        borderRadius: '6px',
                        color: !filterManufacturer ? '#06b6d4' : '#71717a',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    ALL
                </button>
                {MANUFACTURERS.map(mfr => (
                    <button
                        key={mfr.name}
                        onClick={() => setFilterManufacturer(mfr.name)}
                        style={{
                            minWidth: '140px',
                            padding: '8px 16px',
                            background: filterManufacturer === mfr.name
                                ? 'rgba(6, 182, 212, 0.2)'
                                : 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${filterManufacturer === mfr.name ? '#06b6d4' : 'rgba(82, 82, 91, 0.5)'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            if (filterManufacturer !== mfr.name) {
                                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (filterManufacturer !== mfr.name) {
                                e.currentTarget.style.borderColor = 'rgba(82, 82, 91, 0.5)';
                            }
                        }}
                    >
                        <img 
                            src={mfr.logo} 
                            alt={mfr.name}
                            style={{
                                height: '20px',
                                width: 'auto',
                                filter: filterManufacturer === mfr.name 
                                    ? 'brightness(0) saturate(100%) invert(68%) sepia(60%) saturate(2684%) hue-rotate(158deg) brightness(97%) contrast(101%)'
                                    : 'brightness(0) saturate(100%) invert(48%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(96%) contrast(88%)'
                            }}
                        />
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            color: filterManufacturer === mfr.name ? '#06b6d4' : '#71717a'
                        }}>
                            {mfr.name.toUpperCase()}
                        </span>
                    </button>
                ))}
            </div>

            {/* STATUS FILTERS */}
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
                        Add ships manually from the available list
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
                                            marginBottom: '8px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {ship.manufacturer}
                                        </div>
                                    )}

                                    {/* OWNER */}
                                    {ship.owner_username && (
                                        <div style={{
                                            fontSize: '11px',
                                            color: '#06b6d4',
                                            marginBottom: '16px',
                                            padding: '4px 8px',
                                            background: 'rgba(6, 182, 212, 0.1)',
                                            border: '1px solid rgba(6, 182, 212, 0.2)',
                                            borderRadius: '4px',
                                            display: 'inline-block',
                                            letterSpacing: '0.5px',
                                            fontWeight: 600
                                        }}>
                                            OWNER: {ship.owner_username.toUpperCase()}
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

                                        {canDeleteShip(ship) && (
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
                                        )}
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