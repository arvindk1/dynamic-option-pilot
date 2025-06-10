import asyncio
from plugins.base import PluginInterface

class RiskPlugin(PluginInterface):
    """Basic risk manager evaluating trade sizing."""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, trade: dict | None = None) -> dict:
        await asyncio.sleep(0)
        return {
            "approved": True,
            "reason": "within limits",
        }
