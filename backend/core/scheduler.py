from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def market_open_tasks():
    """Placeholder job for tasks that run at market open."""
    logger.info("Running market open routine")


def init_scheduler():
    """Configure scheduler jobs."""
    # Market open at 9:30am US/Eastern Monday-Friday
    trigger = CronTrigger(hour=9, minute=30, day_of_week="mon-fri", timezone="US/Eastern")
    scheduler.add_job(market_open_tasks, trigger, id="market_open")
