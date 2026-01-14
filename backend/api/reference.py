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
    # Liste stricte des 23 matériaux raffinables
    refinable_ids = [1, 5, 11, 13, 15, 20, 22, 33, 39, 44, 47, 58, 60, 73, 75, 77, 95, 98, 115, 117, 175, 179, 181]
    
    query = db.query(Material).filter(Material.id.in_(refinable_ids))
    
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
async def list_refineries(db: Session = Depends(get_db)):
    """Get list of refinery locations from database."""
    refineries = db.query(Location).filter(Location.has_refinery == True).all()
    
    return [
        {
            "id": ref.id,
            "code": ref.code,
            "name": ref.name,
            "system": ref.system,
            "location_type": "refinery"
        }
        for ref in refineries
    ]


@router.get("/salvage-materials")
async def list_salvage_materials(db: Session = Depends(get_db)):
    """Get list of salvage materials (5 specific IDs)."""
    salvage_ids = [19, 63, 172, 173, 174]
    materials = db.query(Material).filter(Material.id.in_(salvage_ids)).all()
    
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


@router.get("/market-materials")
async def list_market_materials(db: Session = Depends(get_db)):
    """Get all materials for market (excludes Ore and Raw Material categories)."""
    materials = db.query(Material).filter(
        Material.category.notin_(['Ore', 'Raw Material'])
    ).order_by(Material.name).all()
    
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