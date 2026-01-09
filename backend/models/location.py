"""
Location model for stations, refineries, ports, etc.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Location(Base):
    """Physical location in the game (station, refinery, port, etc.)."""
    
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    system = Column(String(100))
    planet = Column(String(100))
    moon = Column(String(100))
    location_type = Column(String(50))
    is_available = Column(Boolean, default=True)
    has_trade_terminals = Column(Boolean, default=False)
    has_refinery = Column(Boolean, default=False)
    has_shops = Column(Boolean, default=False)
    faction = Column(String(100))
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    
    # Relationships
    sales = relationship("Sale", back_populates="location")
    
    def __repr__(self):
        return f"<Location(id={self.id}, code='{self.code}', name='{self.name}')>"
