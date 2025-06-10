from datetime import datetime
import pandas as pd
from .base import DataPlugin as BaseDataPlugin, OptionChain, MarketData
import asyncio

class DataPlugin(BaseDataPlugin):
    """Simple TD Ameritrade data plugin returning mock data."""

    async def _setup(self) -> None:
        # Normally you'd set up API clients here
        await asyncio.sleep(0)

    async def execute(self, *args, **kwargs):
        # Not used in this simple example
        pass

    async def get_option_chain(self, symbol: str, expiration: datetime) -> OptionChain:
        await asyncio.sleep(0)
        calls = pd.DataFrame([
            {"strike": 4200, "bid": 1.2, "ask": 1.3},
            {"strike": 4250, "bid": 0.8, "ask": 0.9},
        ])
        puts = pd.DataFrame([
            {"strike": 4200, "bid": 1.1, "ask": 1.2},
            {"strike": 4150, "bid": 0.7, "ask": 0.8},
        ])
        return OptionChain(
            symbol=symbol,
            underlying_price=4400.0,
            timestamp=datetime.utcnow(),
            calls=calls,
            puts=puts,
        )

    async def get_market_data(self, symbol: str) -> MarketData:
        await asyncio.sleep(0)
        return MarketData(
            symbol=symbol,
            price=4400.0,
            volume=1000000,
            timestamp=datetime.utcnow(),
            atr=45.0,
            vix=16.5,
        )

    async def get_historical_data(self, symbol: str, period: str) -> pd.DataFrame:
        await asyncio.sleep(0)
        return pd.DataFrame({"close": [4400.0, 4410.0, 4420.0]})
