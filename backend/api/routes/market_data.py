from fastapi import APIRouter, HTTPException
from datetime import datetime
from core.orchestrator import orchestrator
from core.config import settings

router = APIRouter()

@router.get("/option-chain/{symbol}")
async def get_option_chain(symbol: str, expiration: str):
    """Get option chain for a symbol"""
    data_plugin = orchestrator.get_plugin("data")
    if not data_plugin:
        raise HTTPException(status_code=500, detail="Data plugin not loaded")
    exp_dt = datetime.fromisoformat(expiration)
    chain = await data_plugin.get_option_chain(symbol, exp_dt)
    return {
        "symbol": chain.symbol,
        "underlying_price": chain.underlying_price,
        "expiration": expiration,
        "puts": chain.puts.to_dict(orient="records"),
        "calls": chain.calls.to_dict(orient="records"),
    }

@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote for a symbol"""
    data_plugin = orchestrator.get_plugin("data")
    if not data_plugin:
        raise HTTPException(status_code=500, detail="Data plugin not loaded")
    md = await data_plugin.get_market_data(symbol)
    return {
        "symbol": md.symbol,
        "price": md.price,
        "volume": md.volume,
        "atr": md.atr,
        "vix": md.vix,
        "timestamp": md.timestamp.isoformat(),
    }

@router.get("/volatility/{symbol}")
async def get_volatility_data(symbol: str):
    """Get volatility data"""
    data_plugin = orchestrator.get_plugin("data")
    if not data_plugin:
        raise HTTPException(status_code=500, detail="Data plugin not loaded")
    md = await data_plugin.get_market_data(symbol)
    return {
        "symbol": md.symbol,
        "vix": md.vix,
        "atr": md.atr,
        "timestamp": md.timestamp.isoformat(),
    }
