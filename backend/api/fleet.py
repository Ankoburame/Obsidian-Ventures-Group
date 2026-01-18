"""
Fleet Management API endpoints.
Manage organization ships.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import requests

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
    """
    ship = db.query(Ship).filter(Ship.id == ship_id, Ship.is_active == True).first()
    
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    
    ship.is_active = False
    db.commit()
    
    return {
        "message": f"Ship {ship.name} removed from fleet"
    }


@router.post("/sync-uex")
async def sync_ships_from_uex(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sync ship data from UEX API.
    Fetches all vehicles and creates/updates ships in database.
    """
    try:
        # Call UEX API for vehicles
        url = "https://api.uexcorp.space/2.0/vehicles"
        headers = {
            "Accept": "application/json",
            "User-Agent": "ObsidianVenturesGroup/1.0"
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"UEX API error: {response.status_code}")
        
        data = response.json()
        vehicles = data.get("data", [])
        
        created = 0
        updated = 0
        
        for vehicle in vehicles:
            uex_id = vehicle.get("id")
            name = vehicle.get("name")
            
            if not uex_id or not name:
                continue
            
            # Extract data with multiple fallbacks
            manufacturer = vehicle.get("manufacturer", vehicle.get("manufacturerName", vehicle.get("brand")))
            
            # Role can be in: type, classification, role, focus
            role = (
                vehicle.get("role") or 
                vehicle.get("focus") or 
                vehicle.get("classification") or 
                vehicle.get("type") or 
                "Multi-role"
            )
            
            # Cargo: cargo, cargoCapacity, scu
            cargo = vehicle.get("cargo") or vehicle.get("cargoCapacity") or vehicle.get("scu") or 0
            
            # Images: media.storeUrl, thumbnail, image, imageUrl
            media = vehicle.get("media", {})
            image_url = (
                media.get("storeUrl") or 
                media.get("thumbnail") or 
                vehicle.get("image") or 
                vehicle.get("imageUrl") or 
                None
            )
            
            # Check if ship already exists
            existing = db.query(Ship).filter(Ship.uex_id == uex_id).first()
            
            if existing:
                # Update existing
                existing.name = name
                existing.manufacturer = manufacturer
                existing.role = role
                existing.cargo_capacity_scu = cargo
                existing.image_url = image_url
                updated += 1
            else:
                # Create new
                ship = Ship(
                    uex_id=uex_id,
                    name=name,
                    manufacturer=manufacturer,
                    role=role,
                    cargo_capacity_scu=cargo,
                    image_url=image_url,
                    owner_id=current_user.id,
                    status="available"
                )
                db.add(ship)
                created += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": "Fleet synced with UEX",
            "created": created,
            "updated": updated,
            "total": len(vehicles)
        }
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch from UEX: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")