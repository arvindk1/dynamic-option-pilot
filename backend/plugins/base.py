from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PluginInterface(ABC):
    """Base interface for all plugins"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the plugin"""
        if self._initialized:
            return
        
        await self._setup()
        self._initialized = True
        logger.info(f"{self.__class__.__name__} initialized")
    
    @abstractmethod
    async def _setup(self) -> None:
        """Plugin-specific setup logic"""
        pass
    
    @abstractmethod
    async def execute(self, *args, **kwargs) -> Any:
        """Execute plugin functionality"""
        pass
    
    async def shutdown(self) -> None:
        """Cleanup plugin resources"""
        logger.info(f"{self.__class__.__name__} shutting down")
