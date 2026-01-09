"""
Reference data API endpoints.
Provides access to game reference data (materials, locations, refineries, etc.)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
from models.material import Material
from models.location import Location

router = APIRouter()


@router.get("/materials")
async def list_materials(
    category: Optional[str] = None,
    is_mineable: Optional[bool] = None,
    is_salvage: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get list of materials.
    
    Filters:
    - category: Filter by category (Metal, Ore, Gas, etc.)
    - is_mineable: Filter mineable materials
    - is_salvage: Filter salvage materials
    """
    query = db.query(Material)
    
    if category:
        query = query.filter(Material.category == category)
    
    if is_mineable is not None:
        query = query.filter(Material.is_mineable == is_mineable)
    
    if is_salvage is not None:
        query = query.filter(Material.is_salvage == is_salvage)
    
    materials = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "unit": m.unit,
            "is_mineable": m.is_mineable,
            "is_salvage": m.is_salvage,
            "is_trade_good": m.is_trade_good,
            "base_value": float(m.base_value) if m.base_value else None
        }
        for m in materials
    ]


@router.get("/locations")
async def list_locations(
    system: Optional[str] = None,
    location_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get list of locations.
    
    Filters:
    - system: Filter by system (Stanton, Nyx, etc.)
    - location_type: Filter by type (Station, Refinery, Port, etc.)
    """
    query = db.query(Location)
    
    if system:
        query = query.filter(Location.system == system)
    
    if location_type:
        query = query.filter(Location.location_type == location_type)
    
    locations = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": loc.id,
            "code": loc.code,
            "name": loc.name,
            "system": loc.system,
            "planet": loc.planet,
            "location": loc.location,
            "location_type": loc.location_type,
            "full_path": loc.full_path
        }
        for loc in locations
    ]

# backend/api/reference.py
@router.get("/refineries")
async def list_refineries():
    """Get list of refinery locations - HARDCODED."""
    return [
        {"id": 1158, "code": "ARC-L1", "name": "Mining Center - Refinery - ARC-L1", "system": "Stanton", "location_type": "refinery"},
        {"id": 1159, "code": "ARC-L2", "name": "Mining Center - Refinery - ARC-L2", "system": "Stanton", "location_type": "refinery"},
        {"id": 1160, "code": "ARC-L4", "name": "Mining Center - Refinery - ARC-L4", "system": "Stanton", "location_type": "refinery"},
        {"id": 1173, "code": "CRU-L1", "name": "Mining Center - Refinery - CRU-L1", "system": "Stanton", "location_type": "refinery"},
        {"id": 1174, "code": "HUR-L1", "name": "Mining Center - Refinery - HUR-L1", "system": "Stanton", "location_type": "refinery"},
        {"id": 1175, "code": "HUR-L2", "name": "Mining Center - Refinery - HUR-L2", "system": "Stanton", "location_type": "refinery"},
        {"id": 1176, "code": "MIC-L1", "name": "Mining Center - Refinery - MIC-L1", "system": "Stanton", "location_type": "refinery"},
        {"id": 1177, "code": "MIC-L2", "name": "Mining Center - Refinery - MIC-L2", "system": "Stanton", "location_type": "refinery"},
        {"id": 1178, "code": "MIC-L5", "name": "Mining Center - Refinery - MIC-L5", "system": "Stanton", "location_type": "refinery"},
        {"id": 1384, "code": "CHECKMATE", "name": "Mining Center - Refinery - Checkmate", "system": "Stanton", "location_type": "refinery"},
        {"id": 1390, "code": "ORBITUARY", "name": "Mining Center - Refinery - Orbituary", "system": "Stanton", "location_type": "refinery"},
        {"id": 1412, "code": "RUIN", "name": "Mining Center - Refinery - Ruin Station", "system": "Stanton", "location_type": "refinery"},
        {"id": 1478, "code": "STANGA", "name": "Mining Center - Refinery - Stanton Gateway (Pyro)", "system": "Stanton", "location_type": "refinery"},
        {"id": 1265, "code": "PYRO-GW", "name": "Mining Center - Refinery - Pyro Gateway (Stanton)", "system": "Stanton", "location_type": "refinery"},
        {"id": 1255, "code": "TERRA-GW", "name": "Mining Center - Refinery - Terra Gateway (Stanton)", "system": "Stanton", "location_type": "refinery"},
        {"id": 1264, "code": "NYX-GW", "name": "Mining Center - Refinery - Nyx Gateway (Stanton)", "system": "Stanton", "location_type": "refinery"},
    ]