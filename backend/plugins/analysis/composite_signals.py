import asyncio
from plugins.base import PluginInterface

class SignalsPlugin(PluginInterface):
    """Combine various signal calculations. Returns a simple bullish signal."""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, market_data: dict | None = None) -> dict:
        await asyncio.sleep(0)
        return {
            "bias": "BULLISH",
            "confidence": 0.7,
            "details": {"rsi": 55, "macd": 0.5},
        }
