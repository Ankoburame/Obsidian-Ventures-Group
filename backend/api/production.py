"""
Production API endpoints.
Handles refining jobs, inventory, and sales.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from models.user import User
from models.refining import RefiningJob, RefiningJobMaterial
from models.material import Material
from models.inventory import Inventory, InventoryEvent
from models.sale import Sale
from models.market import MarketPrice
from models.location import Location

router = APIRouter()


# ============================================================================
# REFINING JOBS
# ============================================================================

@router.get("/jobs")
async def list_jobs(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List refining jobs for current user.
    
    Query params:
    - status: Filter by status (processing, ready, collected, cancelled)
    """
    query = db.query(RefiningJob).filter(RefiningJob.user_id == current_user.id)
    
    if status:
        # Auto-update jobs qui sont devenus ready
        if status == "processing":
            db.query(RefiningJob).filter(
                RefiningJob.user_id == current_user.id,
                RefiningJob.status == "processing",
                RefiningJob.end_time <= datetime.utcnow()
            ).update({"status": "ready"})
            db.commit()
        
        query = query.filter(RefiningJob.status == status)
    
    jobs = query.order_by(RefiningJob.created_at.desc()).all()
    
    result = []
    for job in jobs:
        # Get refinery info - SQL BRUT pour éviter le cache
        refinery_result = db.execute(text("SELECT id, name, system FROM locations WHERE id = :id"), {"id": job.refinery_id}).fetchone()
        
        # Get materials
        materials = []
        for jm in job.materials:
            mat = db.query(Material).filter(Material.id == jm.material_id).first()
            materials.append({
                "id": jm.id,
                "material_id": jm.material_id,
                "material_name": mat.name if mat else "Unknown",
                "quantity_refined": float(jm.quantity_refined),
                "unit": jm.unit
            })
        
        result.append({
            "id": job.id,
            "user_id": job.user_id,
            "refinery_id": job.refinery_id,
            "refinery_name": refinery_result[1] if refinery_result else "Unknown",
            "refinery_system": refinery_result[2] if refinery_result else "Unknown",
            "job_type": job.job_type,
            "total_cost": float(job.total_cost) if job.total_cost else 0,
            "processing_time": job.processing_time,
            "status": job.status,
            "start_time": job.start_time.isoformat(),
            "end_time": job.end_time.isoformat() if job.end_time else None,
            "collected_at": job.collected_at.isoformat() if job.collected_at else None,
            "seconds_remaining": job.seconds_remaining,
            "progress_percentage": job.progress_percentage,
            "materials": materials,
            "notes": job.notes,
            "created_at": job.created_at.isoformat()
        })
    
    return result


class JobMaterialInput(BaseModel):
    material_id: int
    quantity_refined: float
    unit: Optional[str] = "SCU"

class CreateJobInput(BaseModel):
    refinery_id: int
    job_type: str
    processing_time: int
    total_cost: float
    materials: List[JobMaterialInput]
    notes: Optional[str] = None

@router.post("/jobs")
async def create_job(
    job_input: CreateJobInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new refining job.
    
    Body:
    {
        "refinery_id": 1,
        "job_type": "mining",
        "processing_time": 120,
        "total_cost": 15000,
        "materials": [
            {"material_id": 1, "quantity_refined": 25.5, "unit": "SCU"}
        ],
        "notes": "Optional notes"
    }
    """
    try:
        # Verify refinery exists - SQL brut
        result = db.execute(text("SELECT id, name FROM locations WHERE id = :id"), {"id": job_input.refinery_id})
        refinery_check = result.fetchone()
        
        if not refinery_check:
            raise HTTPException(status_code=404, detail=f"Refinery not found (searched for ID {job_input.refinery_id})")
        
        # Create job
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(minutes=job_input.processing_time)
        
        new_job = RefiningJob(
            user_id=current_user.id,
            refinery_id=job_input.refinery_id,
            job_type=job_input.job_type,
            total_cost=Decimal(str(job_input.total_cost)),
            processing_time=job_input.processing_time,
            status="processing",
            start_time=start_time,
            end_time=end_time,
            notes=job_input.notes
        )
        
        db.add(new_job)
        db.flush()  # Get job.id
        
        # Add materials
        for mat in job_input.materials:
            job_material = RefiningJobMaterial(
                job_id=new_job.id,
                material_id=mat.material_id,
                quantity_refined=Decimal(str(mat.quantity_refined)),
                unit=mat.unit
            )
            db.add(job_material)
        
        db.commit()
        db.refresh(new_job)
        
        return {"message": "Job created successfully", "job_id": new_job.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{job_id}/collect")
async def collect_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Collect a completed refining job.
    Transfers materials to inventory.
    """
    try:
        # Get job
        job = db.query(RefiningJob).filter(
            RefiningJob.id == job_id,
            RefiningJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job.status == "collected":
            raise HTTPException(status_code=400, detail="Job already collected")
        
        if job.status == "processing" and datetime.utcnow() < job.end_time:
            raise HTTPException(status_code=400, detail="Job not ready yet")
        
        # Transfer materials to inventory
        for jm in job.materials:
            # Upsert inventory
            inv = db.query(Inventory).filter(
                Inventory.user_id == current_user.id,
                Inventory.material_id == jm.material_id
            ).first()
            
            if inv:
                inv.quantity += jm.quantity_refined
                inv.last_updated = datetime.utcnow()
            else:
                inv = Inventory(
                    user_id=current_user.id,
                    material_id=jm.material_id,
                    quantity=jm.quantity_refined,
                    unit=jm.unit
                )
                db.add(inv)
            
            # Create inventory event
            event = InventoryEvent(
                user_id=current_user.id,
                material_id=jm.material_id,
                event_type="refining_completed",
                quantity_change=jm.quantity_refined,
                refining_job_id=job.id
            )
            db.add(event)
        
        # Update job status
        job.status = "collected"
        job.collected_at = datetime.utcnow()
        
        db.commit()
        
        return {"message": "Job collected successfully", "job_id": job.id}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INVENTORY
# ============================================================================

@router.get("/inventory")
async def get_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's inventory with estimated values.
    """
    inventory_items = db.query(Inventory).filter(
        Inventory.user_id == current_user.id,
        Inventory.quantity > 0
    ).all()
    
    result = []
    for inv in inventory_items:
        material = db.query(Material).filter(Material.id == inv.material_id).first()
        market_price = db.query(MarketPrice).filter(MarketPrice.material_id == inv.material_id).first()
        
        avg_price = float(market_price.avg_sell_price) if market_price and market_price.avg_sell_price else 0
        estimated_value = float(inv.quantity) * avg_price
        
        result.append({
            "id": inv.id,
            "material_id": inv.material_id,
            "material_name": material.name if material else "Unknown",
            "category": material.category if material else None,
            "quantity": float(inv.quantity),
            "unit": inv.unit,
            "avg_sell_price": avg_price,
            "estimated_value": round(estimated_value, 2),
            "estimated_total_value": round(estimated_value, 2),  # Alias
            "last_updated": inv.last_updated.isoformat() if inv.last_updated else None
        })
    
    return result


# ============================================================================
# SALES
# ============================================================================

class CreateSaleInput(BaseModel):
    material_id: int
    quantity: float
    unit_price: float
    location_id: Optional[int] = None
    notes: Optional[str] = None

@router.post("/sales")
async def create_sale(
    sale_input: CreateSaleInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a sale of materials.
    
    Body:
    {
        "material_id": 1,
        "quantity": 25.0,
        "unit_price": 45.50,
        "location_id": 5,
        "notes": "Optional"
    }
    """
    try:
        # Check inventory
        inv = db.query(Inventory).filter(
            Inventory.user_id == current_user.id,
            Inventory.material_id == sale_input.material_id
        ).first()
        
        if not inv or inv.quantity < Decimal(str(sale_input.quantity)):
            raise HTTPException(status_code=400, detail="Insufficient inventory")
        
        # Calculate revenue
        total_revenue = Decimal(str(sale_input.quantity)) * Decimal(str(sale_input.unit_price))
        
        # Create sale
        sale = Sale(
            user_id=current_user.id,
            material_id=sale_input.material_id,
            location_id=sale_input.location_id,
            quantity=Decimal(str(sale_input.quantity)),
            unit_price=Decimal(str(sale_input.unit_price)),
            total_revenue=total_revenue,
            notes=sale_input.notes
        )
        db.add(sale)
        db.flush()
        
        # Update inventory
        inv.quantity -= Decimal(str(sale_input.quantity))
        inv.last_updated = datetime.utcnow()
        
        # Create inventory event
        event = InventoryEvent(
            user_id=current_user.id,
            material_id=sale_input.material_id,
            event_type="sale",
            quantity_change=-Decimal(str(sale_input.quantity)),
            sale_id=sale.id,
            notes=sale_input.notes
        )
        db.add(event)
        
        db.commit()
        
        return {"message": "Sale recorded successfully", "sale_id": sale.id}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sales")
async def list_sales(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List recent sales.
    """
    sales = db.query(Sale).filter(
        Sale.user_id == current_user.id
    ).order_by(Sale.sold_at.desc()).limit(limit).all()
    
    result = []
    for sale in sales:
        material = db.query(Material).filter(Material.id == sale.material_id).first()
        
        result.append({
            "id": sale.id,
            "material_id": sale.material_id,
            "material_name": material.name if material else "Unknown",
            "quantity_sold": float(sale.quantity),
            "unit_price": float(sale.unit_price),
            "total_revenue": float(sale.total_revenue),
            "refining_cost": 0,  # TODO: Calculate from job
            "profit": float(sale.total_revenue),  # TODO: Calculate
            "profit_percentage": 0,  # TODO: Calculate
            "sale_date": sale.sold_at.isoformat(),
            "sale_location_name": None,  # TODO: Add location
            "notes": sale.notes
        })
    
    return result


@router.get("/sales/stats")
async def get_sales_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get sales statistics.
    """
    stats = db.query(
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_revenue).label("total_revenue")
    ).filter(Sale.user_id == current_user.id).first()
    
    return {
        "total_sales": stats.total_sales or 0,
        "total_revenue": float(stats.total_revenue) if stats.total_revenue else 0,
        "total_cost": 0,  # TODO: Calculate
        "total_profit": float(stats.total_revenue) if stats.total_revenue else 0,
        "avg_profit_percentage": 0  # TODO: Calculate
    }