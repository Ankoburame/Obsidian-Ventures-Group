"""
Cargo run models for trading and freight operations.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class CargoRun(Base):
    """Cargo run for trading or mission freight."""
    
    __tablename__ = "cargo_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    run_type = Column(String(20), default="mission", nullable=False)  # mission | trade
    
    origin_location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
    destination_location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"))
    
    total_investment = Column(Numeric(12, 2), default=0)
    total_revenue = Column(Numeric(12, 2), default=0)
    profit = Column(Numeric(12, 2), default=0)
    
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, index=True)
    
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("run_type IN ('mission', 'trade')", name="check_run_type"),
        CheckConstraint("total_investment >= 0", name="check_investment_non_negative"),
        CheckConstraint("total_revenue >= 0", name="check_revenue_non_negative"),
    )
    
    # Relationships
    user = relationship("User", back_populates="cargo_runs")
    origin_location = relationship("Location", foreign_keys=[origin_location_id], back_populates="cargo_runs_origin")
    destination_location = relationship("Location", foreign_keys=[destination_location_id], back_populates="cargo_runs_destination")
    materials = relationship("CargoRunMaterial", back_populates="cargo_run", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<CargoRun(id={self.id}, type='{self.run_type}', profit={self.profit})>"


class CargoRunMaterial(Base):
    """Material transported in a cargo run."""
    
    __tablename__ = "cargo_run_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    cargo_run_id = Column(Integer, ForeignKey("cargo_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity = Column(Numeric(12, 2), nullable=False)
    buy_price = Column(Numeric(12, 2))
    sell_price = Column(Numeric(12, 2))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
        CheckConstraint("buy_price IS NULL OR buy_price >= 0", name="check_buy_price_non_negative"),
        CheckConstraint("sell_price IS NULL OR sell_price >= 0", name="check_sell_price_non_negative"),
    )
    
    # Relationships
    cargo_run = relationship("CargoRun", back_populates="materials")
    material = relationship("Material")
    
    def __repr__(self):
        return f"<CargoRunMaterial(run_id={self.cargo_run_id}, material_id={self.material_id}, qty={self.quantity})>"
