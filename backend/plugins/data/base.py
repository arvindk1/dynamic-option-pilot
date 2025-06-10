from plugins.base import PluginInterface
from abc import abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
import pandas as pd

@dataclass
class OptionChain:
    symbol: str
    underlying_price: float
    timestamp: datetime
    calls: pd.DataFrame
    puts: pd.DataFrame

@dataclass
class MarketData:
    symbol: str
    price: float
    volume: int
    timestamp: datetime
    atr: float
    vix: float

class DataPlugin(PluginInterface):
    """Base class for data provider plugins"""
    
    @abstractmethod
    async def get_option_chain(self, symbol: str, expiration: datetime) -> OptionChain:
        """Fetch option chain data"""
        pass
    
    @abstractmethod
    async def get_market_data(self, symbol: str) -> MarketData:
        """Fetch current market data"""
        pass
    
    @abstractmethod
    async def get_historical_data(self, symbol: str, period: str) -> pd.DataFrame:
        """Fetch historical price data"""
        pass
