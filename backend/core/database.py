from models.database import init_db as _init_db

async def init_db():
    """Initialize the database"""
    await _init_db()
