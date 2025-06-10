// src/config/ConfigManager.ts
interface TradingConfiguration {
  // API Configuration
  brokerApi: {
    provider: 'tdameritrade' | 'schwab' | 'ibkr' | 'tastytrade';
    credentials: {
      apiKey: string;
      secret: string;
      accountId: string;
    };
    endpoints: {
      trading: string;
      marketData: string;
      streaming: string;
    };
    rateLimits: {
      ordersPerSecond: number;
      quotesPerMinute: number;
    };
  };

  // Strategy Parameters
  strategy: {
    spx: {
      dteRange: {
        min: number;  // 30 days
        max: number;  // 45 days
        target: number; // 35-40 days
      };
      deltaTargets: {
        putSide: { min: 0.15; max: 0.20 };
        callSide: { min: 0.15; max: 0.20 };
      };
      creditThresholds: {
        minimum: number; // $1.00
        target: number;  // $2.00
      };
      spreadWidths: number[]; // [25, 50, 100]
      maxConcurrentPositions: number; // 5
    };
  };

  // Risk Management
  risk: {
    account: {
      maxMarginUsage: number; // 0.50 (50%)
      dailyLossLimit: number; // 0.05 (5%)
      maxDrawdown: number;    // 0.15 (15%)
    };
    position: {
      stopLoss: number;       // 2.0 (200% of credit)
      profitTarget: number;   // 0.5 (50% of credit)
      timeExit: number;       // 7 DTE
    };
    positionSizing: {
      method: 'fixed' | 'kelly' | 'percentage';
      fixedAmount: number;
      kellyMultiplier: number;
      percentageRisk: number;
    };
  };

  // Market Data
  marketData: {
    primary: 'polygon' | 'alpaca' | 'iex';
    backup: 'polygon' | 'alpaca' | 'iex';
    subscriptions: string[]; // ['SPX', 'VIX', 'SPY']
    updateFrequency: number; // milliseconds
  };

  // Execution
  execution: {
    mode: 'paper' | 'live';
    slippageAllowance: number; // 0.05 ($0.05)
    fillTimeout: number;       // 30 seconds
    orderType: 'market' | 'limit' | 'midpoint';
  };
}

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: TradingConfiguration;
  private environment: 'development' | 'staging' | 'production';

  constructor() {
    this.environment = (process.env.NODE_ENV as any) || 'development';
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    try {
      // Load base configuration
      const baseConfig = require(`./config.${this.environment}.json`);
      
      // Override with environment variables
      this.config = this.mergeWithEnvironment(baseConfig);
      
      // Validate configuration
      this.validateConfiguration();
      
    } catch (error) {
      throw new Error(`Configuration loading failed: ${error.message}`);
    }
  }

  private mergeWithEnvironment(baseConfig: any): TradingConfiguration {
    return {
      ...baseConfig,
      brokerApi: {
        ...baseConfig.brokerApi,
        credentials: {
          apiKey: process.env.BROKER_API_KEY || baseConfig.brokerApi.credentials.apiKey,
          secret: process.env.BROKER_SECRET || baseConfig.brokerApi.credentials.secret,
          accountId: process.env.BROKER_ACCOUNT_ID || baseConfig.brokerApi.credentials.accountId,
        }
      }
    };
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  getConfig(): TradingConfiguration {
    return { ...this.config }; // Return copy to prevent mutation
  }

  updateConfig(updates: Partial<TradingConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();
  }
}
