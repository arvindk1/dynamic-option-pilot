from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from models.database import get_db, PerformanceMetric

router = APIRouter()


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get dashboard metrics from the database."""
    metric = (
        db.query(PerformanceMetric)
        .order_by(PerformanceMetric.date.desc())
        .first()
    )

    if not metric:
        raise HTTPException(status_code=404, detail="No metrics found")

    return {
        "total_pnl": metric.total_pnl,
        "win_rate": metric.win_rate,
        "sharpe_ratio": metric.sharpe_ratio,
        "max_drawdown": metric.max_drawdown,
        "total_trades": metric.total_trades,
        "winning_trades": metric.winning_trades,
        "last_updated": metric.date.isoformat(),
    }

@router.get("/signals")
async def get_market_signals() -> Dict[str, Any]:
    """Get current market signals"""
    # TODO: Implement real signal calculation
    return {
        "market_bias": "BULLISH",
        "confidence": 0.75,
        "signals": {
            "rsi": {"value": 72.3, "signal": "OVERBOUGHT"},
            "ema_cross": {"value": 1, "signal": "BULLISH"},
            "macd": {"value": 0.5, "signal": "BULLISH"},
            "iv_percentile": {"value": 45.2, "signal": "NORMAL"}
        },
        "recommendation": {
            "action": "PUT_CREDIT_SPREAD",
            "reason": "Bullish signals with normal volatility"
        }
    }

@router.get("/performance")
async def get_performance_history(days: int = 30) -> Dict[str, Any]:
    """Get performance history"""
    # TODO: Implement real performance data
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "data": [
            {
                "date": (start_date + timedelta(days=i)).isoformat(),
                "pnl": random.uniform(-500, 1000),
                "cumulative_pnl": random.uniform(0, 15000)
            }
            for i in range(days)
        ]
    }
