"""
Dashboard API endpoints.
Provides stats and analytics for the main dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
from core.security import get_current_user
from models.user import User
from models.refining import RefiningJob
from models.inventory import Inventory
from models.sale import Sale

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for current user.
    
    Returns stats in format expected by frontend.
    """
    # Jobs stats
    active_refining = db.query(RefiningJob).filter(
        RefiningJob.user_id == current_user.id,
        RefiningJob.status.in_(["processing", "ready"])
    ).count()
    
    # Inventory stats
    from models.inventory import Inventory as InventoryModel
    from models.material import Material
    from models.market import MarketPrice
    
    inventory_items = db.query(InventoryModel).filter(
        InventoryModel.user_id == current_user.id,
        InventoryModel.quantity > 0
    ).all()
    
    stock_total = sum(float(inv.quantity) for inv in inventory_items)
    
    # Calculate estimated value using market prices
    estimated_stock_value = 0
    for inv in inventory_items:
        market_price = db.query(MarketPrice).filter(
            MarketPrice.material_id == inv.material_id
        ).first()
        
        if market_price and market_price.avg_sell_price:
            price = float(market_price.avg_sell_price)
        else:
            # Fallback to material base_value
            material = db.query(Material).filter(Material.id == inv.material_id).first()
            price = float(material.base_value) if material and material.base_value else 0
        
        estimated_stock_value += float(inv.quantity) * price
    
    # Refining history (last 5 completed jobs)
    completed_jobs = db.query(RefiningJob).filter(
        RefiningJob.user_id == current_user.id,
        RefiningJob.status == "collected"
    ).order_by(RefiningJob.collected_at.desc()).limit(5).all()
    
    refining_history = []
    for job in completed_jobs:
        materials = []
        for jm in job.materials:
            material = db.query(Material).filter(Material.id == jm.material_id).first()
            materials.append({
                "name": material.name if material else "Unknown",
                "quantity": float(jm.quantity_refined)
            })
        
        refining_history.append({
            "id": job.id,
            "materials": materials,
            "ended_at": job.collected_at.isoformat() if job.collected_at else job.end_time.isoformat()
        })
    
    return {
        "stock_total": round(stock_total, 2),
        "estimated_stock_value": round(estimated_stock_value, 2),
        "active_refining": active_refining,
        "refining_history": refining_history
    }