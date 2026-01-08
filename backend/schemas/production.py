"""
Production (refining) schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class RefiningJobMaterialCreate(BaseModel):
    """Material in a refining job creation request."""
    material_id: int = Field(..., gt=0)
    quantity_refined: Decimal = Field(..., gt=0, decimal_places=2)


class RefiningJobCreate(BaseModel):
    """Refining job creation request."""
    refinery_id: int = Field(..., gt=0)
    job_type: str = Field(..., pattern="^(mining|salvage)$")
    processing_time: int = Field(..., gt=0, description="Processing time in minutes")
    total_cost: Decimal = Field(..., ge=0, decimal_places=2)
    materials: List[RefiningJobMaterialCreate] = Field(..., min_length=1)
    notes: Optional[str] = None
    
    @field_validator('materials')
    def check_materials_not_empty(cls, v):
        if not v:
            raise ValueError('At least one material is required')
        return v


class SaleCreate(BaseModel):
    """Sale creation request."""
    material_id: int = Field(..., gt=0)
    quantity: Decimal = Field(..., gt=0, decimal_places=2)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    location_id: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None
    
    @field_validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class RefiningJobMaterialResponse(BaseModel):
    """Material in a refining job response."""
    id: int
    material_id: int
    material_name: str
    quantity_refined: Decimal
    unit: str
    
    class Config:
        from_attributes = True


class RefiningJobResponse(BaseModel):
    """Refining job response."""
    id: int
    user_id: int
    refinery_id: int
    refinery_name: str
    refinery_system: str
    job_type: str
    total_cost: Decimal
    processing_time: int
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    collected_at: Optional[datetime]
    seconds_remaining: int
    progress_percentage: float
    materials: List[RefiningJobMaterialResponse]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class InventoryItemResponse(BaseModel):
    """Inventory item response."""
    id: int
    material_id: int
    material_name: str
    category: str
    quantity: Decimal
    unit: str
    avg_sell_price: Optional[Decimal]
    estimated_value: Decimal
    last_updated: datetime
    
    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    """Sale response."""
    id: int
    material_id: int
    material_name: str
    location_id: Optional[int]
    location_name: Optional[str]
    quantity: Decimal
    unit_price: Decimal
    total_revenue: Decimal
    sold_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class InventoryEventResponse(BaseModel):
    """Inventory event response."""
    id: int
    event_type: str
    material_id: int
    material_name: str
    quantity_change: Decimal
    created_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True
