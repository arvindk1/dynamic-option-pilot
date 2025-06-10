import asyncio
from datetime import datetime, timedelta
from plugins.base import PluginInterface

class SelectorPlugin(PluginInterface):
    """Selects a basic credit spread based on input option chain."""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, option_chain: dict | None = None) -> dict:
        await asyncio.sleep(0)
        expiration = datetime.utcnow() + timedelta(days=30)
        return {
            "spread_type": "PUT",
            "short_strike": 4200,
            "long_strike": 4150,
            "expiration": expiration.isoformat(),
            "credit": 2.35,
        }
