import pytest
from core.scheduler import scheduler, init_scheduler


def test_init_scheduler_adds_job():
    scheduler.remove_all_jobs()
    init_scheduler()
    jobs = scheduler.get_jobs()
    assert any(job.id == "market_open" for job in jobs)
