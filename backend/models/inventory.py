"""
Inventory models for material storage and tracking.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Inventory(Base):
    """User's material inventory."""
    
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity = Column(Numeric(12, 2), nullable=False, default=0)
    unit = Column(String(10), default="SCU")
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint("user_id", "material_id", name="uq_user_material"),
        CheckConstraint("quantity >= 0", name="check_quantity_non_negative"),
    )
    
    # Relationships
    user = relationship("User", back_populates="inventory")
    material = relationship("Material", back_populates="inventory_items")
    
    def __repr__(self):
        return f"<Inventory(user_id={self.user_id}, material_id={self.material_id}, qty={self.quantity})>"


class InventoryEvent(Base):
    """Inventory movement tracking."""
    
    __tablename__ = "inventory_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(20), nullable=False, index=True)  # refining_completed | sale | adjustment | transfer
    quantity_change = Column(Numeric(12, 2), nullable=False)
    
    refining_job_id = Column(Integer, ForeignKey("refining_jobs.id", ondelete="SET NULL"))
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="SET NULL"))
    
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        CheckConstraint("event_type IN ('refining_completed', 'sale', 'adjustment', 'transfer')", name="check_event_type"),
    )
    
    # Relationships
    user = relationship("User")
    material = relationship("Material")
    refining_job = relationship("RefiningJob", back_populates="inventory_events")
    sale = relationship("Sale", back_populates="inventory_events")
    
    def __repr__(self):
        return f"<InventoryEvent(id={self.id}, type='{self.event_type}', change={self.quantity_change})>"
