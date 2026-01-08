"""
Location model for stations, refineries, ports, etc.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Location(Base):
    """Physical location in the game (station, refinery, port, etc.)."""
    
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    system = Column(String(50), index=True)
    planet = Column(String(50))
    location = Column(String(100))
    location_type = Column(String(50), index=True)
    full_path = Column(String(500))
    distance_from_reference = Column(Numeric(10, 2))
    qt_time_minutes = Column(Numeric(8, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    refineries = relationship("Refinery", back_populates="location")
    sales = relationship("Sale", back_populates="location")
    cargo_runs_origin = relationship("CargoRun", foreign_keys="CargoRun.origin_location_id", back_populates="origin_location")
    cargo_runs_destination = relationship("CargoRun", foreign_keys="CargoRun.destination_location_id", back_populates="destination_location")
    
    def __repr__(self):
        return f"<Location(id={self.id}, code='{self.code}', name='{self.name}')>"
