"""
Refining job models for production tracking.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

from database import Base


class RefiningJob(Base):
    """Refining job for mining or salvage processing."""
    
    __tablename__ = "refining_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refinery_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    
    job_type = Column(String(20), default="mining", nullable=False)  # mining | salvage
    total_cost = Column(Numeric(12, 2))
    processing_time = Column(Integer)  # in minutes
    
    status = Column(String(20), default="processing", nullable=False, index=True)  # processing | ready | collected | cancelled
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, index=True)
    collected_at = Column(DateTime)
    
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("job_type IN ('mining', 'salvage')", name="check_job_type"),
        CheckConstraint("status IN ('processing', 'ready', 'collected', 'cancelled')", name="check_status"),
        CheckConstraint("total_cost >= 0", name="check_cost_positive"),
        CheckConstraint("processing_time > 0", name="check_time_positive"),
    )
    
    # Relationships
    user = relationship("User", back_populates="refining_jobs")
    refinery = relationship("Location", foreign_keys=[refinery_id])
    materials = relationship("RefiningJobMaterial", back_populates="job", cascade="all, delete-orphan")
    inventory_events = relationship("InventoryEvent", back_populates="refining_job")
    
    @property
    def seconds_remaining(self) -> int:
        """Seconds remaining until job completion."""
        if self.end_time and self.status == "processing":
            delta = self.end_time - datetime.utcnow()
            return max(0, int(delta.total_seconds()))
        return 0
    
    @property
    def progress_percentage(self) -> float:
        """Progress percentage (0-100)."""
        if not self.end_time or self.status != "processing":
            return 100.0 if self.status == "ready" else 0.0
        
        total = (self.end_time - self.start_time).total_seconds()
        elapsed = (datetime.utcnow() - self.start_time).total_seconds()
        
        if total <= 0:
            return 100.0
        
        progress = min(100.0, max(0.0, (elapsed / total) * 100.0))
        return round(progress, 1)
    
    @property
    def is_ready(self) -> bool:
        """Check if job is ready for collection."""
        return self.status == "processing" and self.end_time and datetime.utcnow() >= self.end_time
    
    def __repr__(self):
        return f"<RefiningJob(id={self.id}, type='{self.job_type}', status='{self.status}')>"


class RefiningJobMaterial(Base):
    """Material contained in a refining job."""
    
    __tablename__ = "refining_job_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("refining_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity_refined = Column(Numeric(12, 2), nullable=False)
    unit = Column(String(10), default="SCU")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("quantity_refined > 0", name="check_quantity_positive"),
    )
    
    # Relationships
    job = relationship("RefiningJob", back_populates="materials")
    material = relationship("Material")
    
    def __repr__(self):
        return f"<RefiningJobMaterial(job_id={self.job_id}, material_id={self.material_id}, qty={self.quantity_refined})>"
