from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache
import yaml
import os

class Settings(BaseSettings):
    # Application
    app_name: str = "Dynamic Option Pilot"
    app_env: str = "development"
    debug: bool = True
    secret_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # Broker Configuration
    broker_plugin: str = "td_ameritrade"
    paper_trading: bool = True
    broker_api_key: str
    broker_api_secret: str
    broker_account_id: Optional[str] = None
    
    # Strategy Parameters
    symbol: str = "SPX"
    dte_min: int = 30
    dte_max: int = 45
    delta_target: float = 0.10
    credit_threshold: float = 0.50
    max_spread_width: int = 50
    
    # Risk Management
    max_positions: int = 5
    position_size_pct: float = 0.02
    max_margin_usage: float = 0.50
    max_drawdown: float = 0.15
    kelly_fraction: float = 0.25
    
    # Technical Indicators
    rsi_period: int = 14
    rsi_overbought: int = 70
    rsi_oversold: int = 30
    ema_fast: int = 9
    ema_slow: int = 21
    
    # Volatility Settings
    iv_percentile_period: int = 252
    high_vol_threshold: float = 0.75
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Load settings from environment variables and optional YAML file."""
    config_file = os.getenv("CONFIG_FILE", os.path.join(os.path.dirname(__file__), "..", "config.yaml"))
    data = {}
    if os.path.exists(config_file):
        with open(config_file, "r") as f:
            data = yaml.safe_load(f) or {}
    return Settings(**data)

settings = get_settings()
