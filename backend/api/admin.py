"""
Admin API endpoints.
Simple admin functions: list users, reset password, delete inventory.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from core.security import get_current_user, get_password_hash
from models.user import User
from models.inventory import Inventory

router = APIRouter()


def check_admin(current_user: User):
    """Verify user is admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Schemas
class ResetPasswordInput(BaseModel):
    user_id: int
    new_password: str


class DeleteInventoryInput(BaseModel):
    user_id: int
    inventory_id: int


class CreateUserInput(BaseModel):
    username: str
    email: str
    password: str
    is_admin: bool = False


class ToggleAdminInput(BaseModel):
    is_admin: bool


@router.get("/users")
async def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    check_admin(current_user)
    
    users = db.query(User).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.post("/users")
async def create_user(
    data: CreateUserInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)."""
    check_admin(current_user)
    
    # Check if username exists
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        is_admin=data.is_admin,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "is_admin": new_user.is_admin
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)."""
    check_admin(current_user)
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.username} deleted"}


@router.put("/users/{user_id}/role")
async def toggle_admin_role(
    user_id: int,
    data: ToggleAdminInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle admin role (admin only)."""
    check_admin(current_user)
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = data.is_admin
    db.commit()
    
    return {
        "id": user.id,
        "username": user.username,
        "is_admin": user.is_admin
    }


@router.post("/reset-password")
async def reset_user_password(
    data: ResetPasswordInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset a user's password (admin only)."""
    check_admin(current_user)
    
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": f"Password reset for user {user.username}"}


@router.delete("/inventory/{inventory_id}")
async def delete_inventory_item(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an inventory item (admin only)."""
    check_admin(current_user)
    
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    username = db.query(User).filter(User.id == inventory.user_id).first().username
    
    db.delete(inventory)
    db.commit()
    
    return {
        "message": f"Deleted inventory item for user {username}",
        "inventory_id": inventory_id
    }


@router.get("/users/{user_id}/inventory")
async def get_user_inventory(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inventory for a specific user (admin only)."""
    check_admin(current_user)
    
    from models.material import Material
    
    inventory_items = db.query(Inventory).filter(
        Inventory.user_id == user_id,
        Inventory.quantity > 0
    ).all()
    
    result = []
    for inv in inventory_items:
        material = db.query(Material).filter(Material.id == inv.material_id).first()
        
        result.append({
            "id": inv.id,
            "material_id": inv.material_id,
            "material_name": material.name if material else "Unknown",
            "quantity": float(inv.quantity),
            "unit": inv.unit,
            "last_updated": inv.last_updated.isoformat() if inv.last_updated else None
        })
    
    return result
