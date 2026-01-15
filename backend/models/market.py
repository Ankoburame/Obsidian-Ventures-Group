"""
Market models for pricing and trading data.
"""
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, CheckConstraint, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class MarketPrice(Base):
    """Current market prices from UEX."""
    
    __tablename__ = "market_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    avg_buy_price = Column(Numeric(12, 2))
    avg_sell_price = Column(Numeric(12, 2))
    min_buy_price = Column(Numeric(12, 2))
    max_sell_price = Column(Numeric(12, 2))
    
    best_buy_location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
    best_sell_location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
    
    available_at = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("avg_buy_price IS NULL OR avg_buy_price >= 0", name="check_avg_buy_positive"),
        CheckConstraint("avg_sell_price IS NULL OR avg_sell_price >= 0", name="check_avg_sell_positive"),
        CheckConstraint("min_buy_price IS NULL OR min_buy_price >= 0", name="check_min_buy_positive"),
        CheckConstraint("max_sell_price IS NULL OR max_sell_price >= 0", name="check_max_sell_positive"),
    )
    
    # Relationships
    material = relationship("Material", back_populates="market_price")
    best_buy_location = relationship("Location", foreign_keys=[best_buy_location_id])
    best_sell_location = relationship("Location", foreign_keys=[best_sell_location_id])
    
    def __repr__(self):
        return f"<MarketPrice(material_id={self.material_id}, avg_sell={self.avg_sell_price})>"


class PriceSnapshot(Base):
    """Historical price snapshots."""
    
    __tablename__ = "price_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    
    avg_buy_price = Column(Numeric(12, 2))
    avg_sell_price = Column(Numeric(12, 2))
    snapshot_date = Column(Date, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("material_id", "snapshot_date", name="uq_material_snapshot_date"),
    )
    
    # Relationships
    material = relationship("Material")
    
    def __repr__(self):
        return f"<PriceSnapshot(material_id={self.material_id}, date={self.snapshot_date})>"

class MarketPriceHistory(Base):
    """Historical market prices for charting."""
    
    __tablename__ = "market_price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    
    avg_buy_price = Column(Numeric(12, 2))
    avg_sell_price = Column(Numeric(12, 2))
    min_buy_price = Column(Numeric(12, 2))
    max_sell_price = Column(Numeric(12, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("material_id", "date", name="uq_material_date"),
        CheckConstraint("avg_buy_price IS NULL OR avg_buy_price >= 0", name="check_history_avg_buy_positive"),
        CheckConstraint("avg_sell_price IS NULL OR avg_sell_price >= 0", name="check_history_avg_sell_positive"),
        CheckConstraint("min_buy_price IS NULL OR min_buy_price >= 0", name="check_history_min_buy_positive"),
        CheckConstraint("max_sell_price IS NULL OR max_sell_price >= 0", name="check_history_max_sell_positive"),
    )
    
    # Relationships
    material = relationship("Material")
    
    def __repr__(self):
        return f"<MarketPriceHistory(material_id={self.material_id}, date={self.date})>"