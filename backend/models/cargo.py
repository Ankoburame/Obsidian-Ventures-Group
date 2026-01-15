from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class CargoRun(Base):
    __tablename__ = "cargo_runs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    commodity_name = Column(String(255), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    buy_location = Column(String(255), nullable=False)
    buy_price = Column(Numeric(10, 2), nullable=False)
    sell_location = Column(String(255), nullable=False)
    sell_price = Column(Numeric(10, 2), nullable=False)
    total_cost = Column(Numeric(15, 2), nullable=False)
    total_revenue = Column(Numeric(15, 2), nullable=False)
    profit = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), default="active")
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="cargo_runs")