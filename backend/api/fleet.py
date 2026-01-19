"""
Fleet Management API endpoints.
Manage organization ships.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from core.security import get_current_user
from models.user import User
from models.ship import Ship

router = APIRouter()


# Schemas
class ShipCreate(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    role: Optional[str] = None
    cargo_capacity_scu: Optional[float] = None
    status: Optional[str] = "available"
    image_url: Optional[str] = None


class ShipUpdate(BaseModel):
    status: Optional[str] = None
    cargo_capacity_scu: Optional[float] = None


@router.get("/ships")
async def list_ships(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all ships in the fleet.
    Query params:
    - status: Filter by status (available, in_mission, maintenance)
    """
    query = db.query(Ship).filter(Ship.is_active == True)
    
    if status:
        query = query.filter(Ship.status == status)
    
    ships = query.order_by(Ship.name).all()
    
    return [
        {
            "id": s.id,
            "uex_id": s.uex_id,
            "name": s.name,
            "manufacturer": s.manufacturer,
            "role": s.role,
            "cargo_capacity_scu": float(s.cargo_capacity_scu) if s.cargo_capacity_scu else None,
            "status": s.status,
            "image_url": s.image_url,
            "owner_id": s.owner_id,
            "owner_username": s.owner.username if s.owner else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in ships
    ]


@router.post("/ships")
async def create_ship(
    ship_data: ShipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new ship to the fleet.
    """
    ship = Ship(
        name=ship_data.name,
        manufacturer=ship_data.manufacturer,
        role=ship_data.role,
        cargo_capacity_scu=ship_data.cargo_capacity_scu,
        status=ship_data.status,
        image_url=ship_data.image_url,
        owner_id=current_user.id
    )
    
    db.add(ship)
    db.commit()
    db.refresh(ship)
    
    return {
        "id": ship.id,
        "name": ship.name,
        "message": "Ship added to fleet"
    }


@router.put("/ships/{ship_id}")
async def update_ship(
    ship_id: int,
    ship_data: ShipUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a ship's status or capacity.
    """
    ship = db.query(Ship).filter(Ship.id == ship_id, Ship.is_active == True).first()
    
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    
    if ship_data.status is not None:
        ship.status = ship_data.status
    
    if ship_data.cargo_capacity_scu is not None:
        ship.cargo_capacity_scu = ship_data.cargo_capacity_scu
    
    db.commit()
    db.refresh(ship)
    
    return {
        "id": ship.id,
        "name": ship.name,
        "status": ship.status,
        "message": "Ship updated"
    }


@router.delete("/ships/{ship_id}")
async def delete_ship(
    ship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a ship from the fleet (soft delete).
    Only the owner can delete their ship, unless user is Officer or Admin.
    """
    ship = db.query(Ship).filter(Ship.id == ship_id, Ship.is_active == True).first()
    
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    
    # Check permissions: owner can delete their ship, Officer/Admin can delete any
    if current_user.role not in ["officer", "admin"] and ship.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own ships")
    
    ship.is_active = False
    db.commit()
    
    return {
        "message": f"Ship {ship.name} removed from fleet"
    }