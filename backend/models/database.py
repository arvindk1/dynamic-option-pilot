from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from core.config import settings

Base = declarative_base()

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True)
    order_id = Column(String, unique=True, index=True)
    symbol = Column(String)
    trade_type = Column(String)  # PUT or CALL
    short_strike = Column(Float)
    long_strike = Column(Float)
    quantity = Column(Integer)
    entry_credit = Column(Float)
    entry_date = Column(DateTime, default=datetime.utcnow)
    expiration_date = Column(DateTime)
    exit_price = Column(Float, nullable=True)
    exit_date = Column(DateTime, nullable=True)
    pnl = Column(Float, nullable=True)
    commission = Column(Float)
    status = Column(String, default="OPEN")  # OPEN, CLOSED, EXPIRED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    symbol = Column(String)
    price = Column(Float)
    iv_rank = Column(Float)
    vix = Column(Float)
    market_bias = Column(String)
    signal_confidence = Column(Float)

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, unique=True)
    total_pnl = Column(Float)
    win_rate = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    total_trades = Column(Integer)
    winning_trades = Column(Integer)

# Database setup
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
