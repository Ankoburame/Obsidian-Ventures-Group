"""
Market API endpoints.
Provides access to market prices and commodities data.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from database import get_db
from models.material import Material
from models.market import MarketPrice, PriceSnapshot
from services.uex.uex_service import refresh_all_prices, refresh_single_material

router = APIRouter()


@router.get("/commodities")
async def list_commodities(
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get list of tradeable commodities (alias for materials).
    Used by commerce/trading pages.
    """
    query = db.query(Material).filter(Material.is_trade_good == True)
    
    if category:
        query = query.filter(Material.category == category)
    
    materials = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": m.id,
            "name": m.name,
            "category": m.category,
            "unit": m.unit,
            "base_value": float(m.base_value) if m.base_value else 0
        }
        for m in materials
    ]


@router.get("/prices")
async def list_market_prices(
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get market prices for materials (excludes Ore and Raw Material categories).
    """
    query = db.query(MarketPrice).join(Material).filter(
        Material.category.notin_(['Ore', 'Raw Material'])
    )
    
    if category:
        query = query.filter(Material.category == category)
    
    prices = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": p.id,
            "material_id": p.material_id,
            "material_name": p.material.name,
            "category": p.material.category,
            "avg_buy_price": float(p.avg_buy_price) if p.avg_buy_price else None,
            "avg_sell_price": float(p.avg_sell_price) if p.avg_sell_price else None,
            "min_buy_price": float(p.min_buy_price) if p.min_buy_price else None,
            "max_sell_price": float(p.max_sell_price) if p.max_sell_price else None,
            "last_updated": p.last_updated.isoformat() if p.last_updated else None
        }
        for p in prices
    ]


@router.get("/prices/{material_id}")
async def get_material_price(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Get market price for a specific material.
    """
    price = db.query(MarketPrice).filter(MarketPrice.material_id == material_id).first()
    
    if not price:
        return {
            "material_id": material_id,
            "avg_buy_price": None,
            "avg_sell_price": None,
            "message": "No market data available"
        }
    
    return {
        "id": price.id,
        "material_id": price.material_id,
        "material_name": price.material.name,
        "avg_buy_price": float(price.avg_buy_price) if price.avg_buy_price else None,
        "avg_sell_price": float(price.avg_sell_price) if price.avg_sell_price else None,
        "min_buy_price": float(price.min_buy_price) if price.min_buy_price else None,
        "max_sell_price": float(price.max_sell_price) if price.max_sell_price else None,
        "best_buy_location_id": price.best_buy_location_id,
        "best_sell_location_id": price.best_sell_location_id,
        "last_updated": price.last_updated.isoformat() if price.last_updated else None
    }


@router.post("/prices/refresh")
async def refresh_market_prices(
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Refresh market prices from UEX API.
    
    Args:
        force: If True, ignore cache and force refresh
    """
    try:
        stats = refresh_all_prices(db, force=force)
        return {
            "success": True,
            "stats": stats,
            "message": f"Refreshed {stats.get('updated', 0)} prices, created {stats.get('created', 0)} new materials"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prices/refresh/{material_id}")
async def refresh_material_price(
    material_id: int,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Refresh price for a specific material from UEX API.
    
    Args:
        material_id: ID of the material to refresh
        force: If True, ignore cache and force refresh
    """
    try:
        success = refresh_single_material(db, material_id, force=force)
        
        if success:
            return {
                "success": True,
                "message": f"Price refreshed for material {material_id}"
            }
        else:
            return {
                "success": False,
                "message": f"Price not refreshed (cache valid or no data available)"
            }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices/{material_id}/history")
async def get_price_history(
    material_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get price history for a specific material.
    
    Args:
        material_id: ID of the material
        days: Number of days of history to retrieve (max 365)
    """
    # Vérifier que le matériau existe
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Récupérer l'historique
    since = datetime.utcnow() - timedelta(days=days)
    
    snapshots = (
        db.query(PriceSnapshot)
        .filter(
            PriceSnapshot.material_id == material_id,
            PriceSnapshot.snapshot_date >= since.date()
        )
        .order_by(PriceSnapshot.snapshot_date.asc())
        .all()
    )
    
    return {
        "material_id": material_id,
        "material_name": material.name,
        "days": days,
        "data_points": len(snapshots),
        "history": [
            {
                "date": s.snapshot_date.isoformat(),
                "avg_buy_price": float(s.avg_buy_price) if s.avg_buy_price else None,
                "avg_sell_price": float(s.avg_sell_price) if s.avg_sell_price else None,
            }
            for s in snapshots
        ]
    }


@router.get("/prices/history/stats")
async def get_history_stats(db: Session = Depends(get_db)):
    """
    Get statistics about price history data.
    """
    from sqlalchemy import func
    from datetime import date
    
    # Total d'entrées
    total_entries = db.query(func.count(PriceSnapshot.id)).scalar()
    
    # Nombre de matériaux avec historique
    materials_with_history = db.query(
        func.count(func.distinct(PriceSnapshot.material_id))
    ).scalar()
    
    # Date du premier et dernier snapshot
    first_snapshot = db.query(func.min(PriceSnapshot.snapshot_date)).scalar()
    last_snapshot = db.query(func.max(PriceSnapshot.snapshot_date)).scalar()
    
    # Snapshots aujourd'hui
    today = date.today()
    today_snapshots = db.query(func.count(PriceSnapshot.id)).filter(
        PriceSnapshot.snapshot_date == today
    ).scalar()
    
    # Nombre de jours d'historique
    if first_snapshot and last_snapshot:
        history_days = (last_snapshot - first_snapshot).days + 1
    else:
        history_days = 0
    
    return {
        "total_entries": total_entries,
        "materials_with_history": materials_with_history,
        "first_snapshot": first_snapshot.isoformat() if first_snapshot else None,
        "last_snapshot": last_snapshot.isoformat() if last_snapshot else None,
        "today_snapshots": today_snapshots,
        "history_days": history_days,
    }