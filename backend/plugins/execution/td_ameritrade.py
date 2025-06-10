import asyncio
from datetime import datetime
from plugins.base import PluginInterface

class ExecutorPlugin(PluginInterface):
    """Mock executor plugin simulating order placement."""

    async def _setup(self) -> None:
        await asyncio.sleep(0)

    async def execute(self, order: dict) -> dict:
        await asyncio.sleep(0)
        return {
            "order_id": f"SIM-{int(datetime.utcnow().timestamp())}",
            "status": "FILLED",
            "filled_price": order.get("limit_credit", 2.35),
        }
