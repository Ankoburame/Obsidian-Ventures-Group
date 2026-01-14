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
from models.cargo import CargoRun

router = APIRouter()


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
    """Record a trade run."""
    try:
        # Calculate values
        total_cost = Decimal(str(run_input.quantity)) * Decimal(str(run_input.buy_price))
        total_revenue = Decimal(str(run_input.quantity)) * Decimal(str(run_input.sell_price))
        profit = total_revenue - total_cost
        
        # Create cargo run
        cargo_run = CargoRun(
            user_id=current_user.id,
            commodity_name=run_input.commodity_name,
            quantity=Decimal(str(run_input.quantity)),
            buy_location=run_input.buy_location,
            buy_price=Decimal(str(run_input.buy_price)),
            sell_location=run_input.sell_location,
            sell_price=Decimal(str(run_input.sell_price)),
            total_cost=total_cost,
            total_revenue=total_revenue,
            profit=profit,
            status="active",
            notes=run_input.notes
        )
        
        db.add(cargo_run)
        db.commit()
        db.refresh(cargo_run)
        
        return {"message": "Trade run created", "id": cargo_run.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs")
async def list_trade_runs(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List trade runs."""
    runs = db.query(CargoRun).filter(
        CargoRun.user_id == current_user.id
    ).order_by(CargoRun.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": run.id,
            "commodity_name": run.commodity_name,
            "buy_location": run.buy_location,
            "sell_location": run.sell_location,
            "quantity": float(run.quantity),
            "buy_price": float(run.buy_price),
            "sell_price": float(run.sell_price),
            "total_investment": float(run.total_cost),
            "expected_profit": float(run.profit),
            "status": run.status,
            "created_at": run.created_at.isoformat(),
            "delivered_at": run.delivered_at.isoformat() if run.delivered_at else None,
            "notes": run.notes
        }
        for run in runs
    ]


@router.post("/runs/{run_id}/deliver")
async def deliver_run(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark run as delivered."""
    run = db.query(CargoRun).filter(
        CargoRun.id == run_id,
        CargoRun.user_id == current_user.id  # ✅ Vérifie que c'est bien le run de l'user
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if run.status == "delivered":
        raise HTTPException(status_code=400, detail="Already delivered")
    
    run.status = "delivered"
    run.delivered_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Run delivered"}


@router.post("/runs/{run_id}/cancel")
async def cancel_run(
    run_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel run."""
    run = db.query(CargoRun).filter(
        CargoRun.id == run_id,
        CargoRun.user_id == current_user.id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run.status = "cancelled"
    db.commit()
    
    return {"message": "Run cancelled"}


@router.get("/stats")
async def get_cargo_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive cargo stats for the user.
    Returns total runs, profits, best routes, top commodities, and time series data.
    """
    # Stats globales
    delivered_runs = db.query(CargoRun).filter(
        CargoRun.user_id == current_user.id,
        CargoRun.status == "delivered"
    ).all()
    
    total_runs = len(delivered_runs)
    total_profit = sum(float(run.profit) for run in delivered_runs)
    total_revenue = sum(float(run.total_revenue) for run in delivered_runs)
    total_investment = sum(float(run.total_cost) for run in delivered_runs)
    avg_profit = total_profit / total_runs if total_runs > 0 else 0
    
    # Meilleure route (par profit total généré)
    route_profits = {}
    for run in delivered_runs:
        route_key = f"{run.buy_location} → {run.sell_location}"
        if route_key not in route_profits:
            route_profits[route_key] = {"profit": 0, "count": 0}
        route_profits[route_key]["profit"] += float(run.profit)
        route_profits[route_key]["count"] += 1
    
    best_route = None
    if route_profits:
        best_route_key = max(route_profits.items(), key=lambda x: x[1]["profit"])
        best_route = {
            "route": best_route_key[0],
            "total_profit": best_route_key[1]["profit"],
            "runs_count": best_route_key[1]["count"]
        }
    
    # Top 5 commodités par profit
    commodity_profits = {}
    for run in delivered_runs:
        if run.commodity_name not in commodity_profits:
            commodity_profits[run.commodity_name] = {"profit": 0, "quantity": 0, "runs": 0}
        commodity_profits[run.commodity_name]["profit"] += float(run.profit)
        commodity_profits[run.commodity_name]["quantity"] += float(run.quantity)
        commodity_profits[run.commodity_name]["runs"] += 1
    
    top_commodities = sorted(
        [
            {
                "name": name,
                "total_profit": data["profit"],
                "total_quantity": data["quantity"],
                "runs_count": data["runs"]
            }
            for name, data in commodity_profits.items()
        ],
        key=lambda x: x["total_profit"],
        reverse=True
    )[:5]
    
    # Données temporelles (30 derniers jours)
    time_series = []
    for run in sorted(delivered_runs, key=lambda x: x.delivered_at or x.created_at):
        time_series.append({
            "date": (run.delivered_at or run.created_at).isoformat(),
            "profit": float(run.profit),
            "revenue": float(run.total_revenue)
        })
    
    return {
        "total_runs": total_runs,
        "total_profit": total_profit,
        "total_revenue": total_revenue,
        "total_investment": total_investment,
        "avg_profit_per_run": avg_profit,
        "best_route": best_route,
        "top_commodities": top_commodities,
        "profit_margin_pct": (total_profit / total_investment * 100) if total_investment > 0 else 0,
        "time_series": time_series[-30:]  # Derniers 30 runs
    }