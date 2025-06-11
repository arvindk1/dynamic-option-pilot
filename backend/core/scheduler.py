from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from core.orchestrator import orchestrator
from core.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def market_open_tasks():
    """Job that runs at market open to fetch initial market data."""
    logger.info("Running market open routine")
    data_plugin = orchestrator.get_plugin("data")
    if data_plugin:
        await data_plugin.initialize()
        md = await data_plugin.get_market_data(settings.symbol)
        logger.info(f"{settings.symbol} open price: {md.price}")


def init_scheduler():
    """Configure scheduler jobs."""
    # Market open at 9:30am US/Eastern Monday-Friday
    trigger = CronTrigger(hour=9, minute=30, day_of_week="mon-fri", timezone="US/Eastern")
    scheduler.add_job(market_open_tasks, trigger, id="market_open")

