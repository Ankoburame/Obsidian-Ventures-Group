"""
Ship model for fleet management.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Ship(Base):
    """Ship in organization fleet."""
    
    __tablename__ = "ships"
    
    id = Column(Integer, primary_key=True, index=True)
    uex_id = Column(Integer, unique=True, index=True, nullable=True)  # ID from UEX API
    name = Column(String(100), nullable=False)  # Ship name (ex: "Aegis Avenger Titan")
    manufacturer = Column(String(50), nullable=True)  # Manufacturer (ex: "Aegis Dynamics")
    role = Column(String(50), nullable=True)  # Role (ex: "Combat", "Cargo", "Mining")
    cargo_capacity_scu = Column(Numeric(10, 2), nullable=True)  # Cargo capacity in SCU
    status = Column(String(20), default="available")  # available, in_mission, maintenance
    image_url = Column(String(500), nullable=True)  # URL to ship image (from UEX)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who added/owns the ship
    is_active = Column(Boolean, default=True)  # Soft delete flag
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", backref="ships")
    
    def __repr__(self):
        return f"<Ship(id={self.id}, name='{self.name}', manufacturer='{self.manufacturer}')>"