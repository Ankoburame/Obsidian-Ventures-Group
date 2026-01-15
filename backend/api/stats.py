"""
Stats and History API endpoints.
Provides unified view of refining jobs, salvage, and cargo runs with tagging support.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, cast, String
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from models.user import User
from models.refining import RefiningJob, RefiningJobMaterial
from models.cargo import CargoRun

router = APIRouter()


class TagsUpdate(BaseModel):
    tags: List[str]


@router.get("/history")
async def get_history(
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get unified history of all user activities (refining jobs, salvage, cargo runs).
    Optionally filter by tag.
    """
    events = []
    
    # ===== REFINING/SALVAGE JOBS =====
    query = db.query(RefiningJob).filter(RefiningJob.user_id == current_user.id)
    
    # Filter by tag if provided
    if tag:
        # PostgreSQL JSON contains check
        query = query.filter(
            cast(RefiningJob.tags, String).contains(f'"{tag}"')
        )
    
    jobs = query.order_by(RefiningJob.created_at.desc()).all()
    
    for job in jobs:
        # Calculate amount (negative cost)
        amount = -float(job.total_cost) if job.total_cost else 0
        
        # Get materials summary
        materials = db.query(RefiningJobMaterial).filter(
            RefiningJobMaterial.job_id == job.id
        ).all()
        
        materials_list = ", ".join([
            f"{float(m.quantity_refined)} {m.material.name}"
            for m in materials
        ]) if materials else "No materials"
        
        # Get crew members (from notes or future crew table)
        crew_members = []
        
        events.append({
            "id": f"R-{job.id}",
            "source": "refining",
            "title": f"{job.job_type.capitalize()} Job #{job.id}",
            "description": f"Processed {materials_list} at {job.refinery.name}",
            "event_type": job.job_type,
            "tags": job.tags or [],
            "amount": amount,
            "location": job.refinery.name,
            "event_date": job.created_at.isoformat(),
            "crew_members_details": crew_members,
            "status": job.status
        })
    
    # ===== CARGO RUNS (optional) =====
    cargo_query = db.query(CargoRun).filter(CargoRun.user_id == current_user.id)
    
    if tag:
        cargo_query = cargo_query.filter(
            cast(CargoRun.tags, String).contains(f'"{tag}"')
        )
    
    cargo_runs = cargo_query.order_by(CargoRun.created_at.desc()).limit(50).all()
    
    for run in cargo_runs:
        events.append({
            "id": f"C-{run.id}",
            "source": "cargo",
            "title": f"Trade Run #{run.id}",
            "description": f"{run.commodity_name}: {run.buy_location} → {run.sell_location}",
            "event_type": "trading",
            "tags": run.tags or [],
            "amount": float(run.profit),
            "location": run.sell_location,
            "event_date": run.created_at.isoformat(),
            "crew_members_details": [],
            "status": run.status
        })
    
    # Sort all events by date (newest first)
    events.sort(key=lambda x: x["event_date"], reverse=True)
    
    return events


@router.patch("/history/{event_id}")
async def update_event_tags(
    event_id: str,
    tags_data: TagsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update tags for a specific event.
    Event ID format: "R-123" (refining) or "C-456" (cargo)
    """
    # Parse event ID
    if event_id.startswith("R-"):
        # Refining/Salvage job
        job_id = int(event_id.split("-")[1])
        job = db.query(RefiningJob).filter(
            RefiningJob.id == job_id,
            RefiningJob.user_id == current_user.id
        ).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job.tags = tags_data.tags
        db.commit()
        
        return {"message": "Tags updated", "tags": job.tags}
    
    elif event_id.startswith("C-"):
        # Cargo run
        run_id = int(event_id.split("-")[1])
        run = db.query(CargoRun).filter(
            CargoRun.id == run_id,
            CargoRun.user_id == current_user.id
        ).first()
        
        if not run:
            raise HTTPException(status_code=404, detail="Cargo run not found")
        
        run.tags = tags_data.tags
        db.commit()
        
        return {"message": "Tags updated", "tags": run.tags}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid event ID format")