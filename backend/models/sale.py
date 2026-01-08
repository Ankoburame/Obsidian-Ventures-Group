"""
Sale model for material transactions.
"""
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Sale(Base):
    """Material sale transaction."""
    
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), index=True)
    
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_revenue = Column(Numeric(12, 2), nullable=False)
    
    sold_at = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="check_price_non_negative"),
        CheckConstraint("total_revenue >= 0", name="check_revenue_non_negative"),
    )
    
    # Relationships
    user = relationship("User", back_populates="sales")
    material = relationship("Material", back_populates="sales")
    location = relationship("Location", back_populates="sales")
    inventory_events = relationship("InventoryEvent", back_populates="sale")
    
    def __repr__(self):
        return f"<Sale(id={self.id}, material_id={self.material_id}, total={self.total_revenue})>"
