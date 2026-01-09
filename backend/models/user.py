"""
User model for authentication and authorization.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class User(Base):
    """User account."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)
    role = Column(String(50), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    refining_jobs = relationship("RefiningJob", back_populates="user", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="user", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="user", cascade="all, delete-orphan")
    cargo_runs = relationship("CargoRun", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"
