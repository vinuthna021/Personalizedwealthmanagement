from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "wealth_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.market_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True
)

celery_app.conf.beat_schedule = {
    "refresh-market-prices-nightly": {
        "task": "app.tasks.market_tasks.refresh_market_prices",
        "schedule": crontab(hour=2, minute=0),
    }
}
