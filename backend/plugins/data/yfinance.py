from datetime import datetime
from .base import DataPlugin as BaseDataPlugin, OptionChain, MarketData
import pandas as pd
import yfinance as yf
import asyncio

class DataPlugin(BaseDataPlugin):
    """Yahoo Finance data plugin"""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, *args, **kwargs):
        pass

    async def get_option_chain(self, symbol: str, expiration: datetime) -> OptionChain:
        try:
            ticker = yf.Ticker(symbol)
            chain = ticker.option_chain(expiration.strftime("%Y-%m-%d"))
            calls = chain.calls
            puts = chain.puts
            underlying_price = ticker.history(period="1d").close.iloc[-1]
        except Exception:
            # Fallback mock data if request fails
            calls = pd.DataFrame([{"strike": 0, "bid": 0, "ask": 0}])
            puts = pd.DataFrame([{"strike": 0, "bid": 0, "ask": 0}])
            underlying_price = 0.0
        return OptionChain(
            symbol=symbol,
            underlying_price=float(underlying_price),
            timestamp=datetime.utcnow(),
            calls=calls,
            puts=puts,
        )

    async def get_market_data(self, symbol: str) -> MarketData:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            price = info.get("regularMarketPrice")
            volume = info.get("volume", 0)
            atr = ticker.history(period="14d").close.diff().abs().rolling(window=14).mean().iloc[-1]
            vix = yf.Ticker("^VIX").history(period="1d").close.iloc[-1]
        except Exception:
            price = 0.0
            volume = 0
            atr = 0.0
            vix = 0.0
        return MarketData(
            symbol=symbol,
            price=float(price),
            volume=int(volume),
            timestamp=datetime.utcnow(),
            atr=float(atr),
            vix=float(vix),
        )

    async def get_historical_data(self, symbol: str, period: str) -> pd.DataFrame:
        try:
            data = yf.download(symbol, period=period, progress=False)
        except Exception:
            data = pd.DataFrame()
        return data
