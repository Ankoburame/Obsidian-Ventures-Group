"""
Refinery model for processing locations.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Refinery(Base):
    """Refinery for processing mined/salvaged materials."""
    
    __tablename__ = "refineries"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), index=True)
    name = Column(String(100), nullable=False)
    system = Column(String(50), index=True)
    processing_time_modifier = Column(Numeric(5, 2), default=1.0)
    cost_modifier = Column(Numeric(5, 2), default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="refineries")
    refining_jobs = relationship("RefiningJob", back_populates="refinery")
    
    def __repr__(self):
        return f"<Refinery(id={self.id}, name='{self.name}', system='{self.system}')>"
