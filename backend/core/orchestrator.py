import importlib
from typing import Dict, Any, Optional
import logging
from core.config import settings

logger = logging.getLogger(__name__)

class PluginOrchestrator:
    """Dynamically loads and manages plugins"""
    
    def __init__(self):
        self.plugins: Dict[str, Any] = {}
        self._load_plugins()
    
    def _load_plugins(self):
        """Load configured plugins"""
        plugin_map = {
            "data": f"plugins.data.{settings.data_plugin}",
            "signals": "plugins.analysis.composite_signals",
            "selector": "plugins.trading.spread_selector",
            "risk": "plugins.risk.portfolio_manager",
            "executor": f"plugins.execution.{settings.broker_plugin}"
        }
        
        for name, module_path in plugin_map.items():
            try:
                module = importlib.import_module(module_path)
                plugin_class = getattr(module, f"{name.title()}Plugin")
                self.plugins[name] = plugin_class(settings.dict())
                logger.info(f"Loaded plugin: {name} from {module_path}")
            except Exception as e:
                logger.error(f"Failed to load plugin {name}: {e}")
    
    async def initialize_all(self):
        """Initialize all plugins"""
        for name, plugin in self.plugins.items():
            await plugin.initialize()
    
    def get_plugin(self, name: str):
        """Get a specific plugin"""
        return self.plugins.get(name)

orchestrator = PluginOrchestrator()
