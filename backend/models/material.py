"""
Material model for tradeable commodities.
"""
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Material(Base):
    """Tradeable material (ore, metal, gas, salvage, etc.)."""
    
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    uex_id = Column(Integer, unique=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), index=True)  # Metal, Ore, Gas, Mineral, Salvage
    unit = Column(String(10), default="SCU")
    is_mineable = Column(Boolean, default=False)
    is_salvage = Column(Boolean, default=False)
    is_trade_good = Column(Boolean, default=False)
    base_value = Column(Numeric(12, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    market_price = relationship("MarketPrice", back_populates="material", uselist=False)
    inventory_items = relationship("Inventory", back_populates="material")
    sales = relationship("Sale", back_populates="material")
    
    def __repr__(self):
        return f"<Material(id={self.id}, name='{self.name}', category='{self.category}')>"
