"""
Cargo/Commerce API endpoints.
Handles trade runs and cargo management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

from database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter()


# Pydantic schemas
class TradeRunInput(BaseModel):
    commodity_name: str
    quantity: float
    buy_location: str
    buy_price: float
    sell_location: str
    sell_price: float
    notes: Optional[str] = None


@router.post("/runs")
async def create_trade_run(
    run_input: TradeRunInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record a trade run.
    
    Body:
    {
        "commodity_name": "Laranite",
        "quantity": 100,
        "buy_location_id": 1,
        "buy_price": 28.50,
        "sell_location_id": 2,
        "sell_price": 32.00,
        "notes": "Optional"
    }
    """
    try:
        # Calculate profit
        total_cost = Decimal(str(run_input.quantity)) * Decimal(str(run_input.buy_price))
        total_revenue = Decimal(str(run_input.quantity)) * Decimal(str(run_input.sell_price))
        profit = total_revenue - total_cost
        profit_percentage = (profit / total_cost * 100) if total_cost > 0 else 0
        
        # For now, just return success
        # TODO: Create TradeRun model and save to DB
        
        return {
            "message": "Trade run recorded successfully",
            "profit": float(profit),
            "profit_percentage": float(profit_percentage)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs")
async def list_trade_runs(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List recent trade runs.
    """
    # TODO: Fetch from DB when TradeRun model is created
    return []


@router.get("/stats")
async def get_cargo_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cargo/trading statistics.
    """
    # TODO: Calculate from TradeRun records
    return {
        "total_runs": 0,
        "total_profit": 0,
        "avg_profit_per_run": 0,
        "best_route": None
    }
