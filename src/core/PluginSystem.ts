// src/core/PluginSystem.ts
interface TradingPlugin {
  name: string;
  version: string;
  type: 'signal' | 'execution' | 'risk' | 'data';
  dependencies: string[];
  
  initialize(config: any): Promise<void>;
  execute(input: any): Promise<any>;
  cleanup(): Promise<void>;
}

class PluginOrchestrator {
  private plugins: Map<string, TradingPlugin> = new Map();
  private pluginGraph: Map<string, string[]> = new Map();

  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      // Dynamic import for runtime loading
      const PluginClass = await import(pluginPath);
      const plugin: TradingPlugin = new PluginClass.default();
      
      // Validate plugin interface
      this.validatePlugin(plugin);
      
      // Check dependencies
      await this.resolveDependencies(plugin);
      
      // Initialize plugin
      await plugin.initialize(ConfigurationManager.getInstance().getConfig());
      
      // Register plugin
      this.plugins.set(plugin.name, plugin);
      
      console.log(`Plugin loaded: ${plugin.name} v${plugin.version}`);
      
    } catch (error) {
      console.error(`Failed to load plugin ${pluginPath}:`, error);
      throw error;
    }
  }

  async executePluginChain(type: string, input: any): Promise<any> {
    const relevantPlugins = Array.from(this.plugins.values())
      .filter(plugin => plugin.type === type)
      .sort((a, b) => this.getPluginPriority(a) - this.getPluginPriority(b));

    let result = input;
    for (const plugin of relevantPlugins) {
      try {
        result = await plugin.execute(result);
      } catch (error) {
        console.error(`Plugin execution failed: ${plugin.name}`, error);
        // Implement fallback strategy
        result = await this.handlePluginFailure(plugin, result, error);
      }
    }

    return result;
  }

  // Hot-swap plugins without system restart
  async swapPlugin(oldPluginName: string, newPluginPath: string): Promise<void> {
    const oldPlugin = this.plugins.get(oldPluginName);
    if (oldPlugin) {
      await oldPlugin.cleanup();
      this.plugins.delete(oldPluginName);
    }
    
    await this.loadPlugin(newPluginPath);
  }
}

// Example Signal Plugin
class RSIMACDSignalPlugin implements TradingPlugin {
  name = 'RSI-MACD-Signal';
  version = '1.0.0';
  type = 'signal' as const;
  dependencies = ['market-data'];

  private rsiPeriod = 14;
  private macdFast = 12;
  private macdSlow = 26;
  private macdSignal = 9;

  async initialize(config: any): Promise<void> {
    this.rsiPeriod = config.signals?.rsi?.period || 14;
    console.log(`RSI-MACD Signal Plugin initialized with RSI period: ${this.rsiPeriod}`);
  }

  async execute(marketData: MarketData): Promise<SignalResult> {
    const rsi = this.calculateRSI(marketData.prices, this.rsiPeriod);
    const macd = this.calculateMACD(marketData.prices, this.macdFast, this.macdSlow, this.macdSignal);
    
    const signal = this.generateSignal(rsi, macd, marketData);
    
    return {
      signal,
      confidence: this.calculateConfidence(rsi, macd),
      metadata: {
        rsi: rsi.current,
        macd: macd.current,
        timestamp: Date.now()
      }
    };
  }

  async cleanup(): Promise<void> {
    console.log('RSI-MACD Signal Plugin cleaned up');
  }

  private generateSignal(rsi: RSIResult, macd: MACDResult, marketData: MarketData): TradingSignal {
    let signalStrength = 0;
    let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    // RSI Oversold/Overbought
    if (rsi.current < 30) signalStrength += 0.3; // Bullish
    if (rsi.current > 70) signalStrength -= 0.3; // Bearish

    // MACD Crossover
    if (macd.histogram > 0 && macd.previousHistogram <= 0) {
      signalStrength += 0.4; // Bullish crossover
    }
    if (macd.histogram < 0 && macd.previousHistogram >= 0) {
      signalStrength -= 0.4; // Bearish crossover
    }

    // Determine signal type
    if (signalStrength > 0.5) signalType = 'BUY';
    if (signalStrength < -0.5) signalType = 'SELL';

    return {
      type: signalType,
      strength: Math.abs(signalStrength),
      timestamp: Date.now(),
      underlying: 'SPX'
    };
  }
}
