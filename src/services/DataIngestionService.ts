// src/services/DataIngestionService.ts
class EnhancedDataIngestion {
  private rateLimiter: RateLimiter;
  private retryManager: RetryManager;
  private dataCache: DataCache;
  private wsConnections: Map<string, WebSocket> = new Map();

  constructor(config: MarketDataConfig) {
    this.rateLimiter = new RateLimiter(config.rateLimits);
    this.retryManager = new RetryManager(config.retryConfig);
    this.dataCache = new DataCache(config.cacheConfig);
  }

  // Historical Data Loading with Multiple Formats
  async loadHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    dataType: 'options' | 'underlying' | 'both' = 'both'
  ): Promise<HistoricalDataSet> {
    
    const cacheKey = `${symbol}_${startDate.toISOString()}_${endDate.toISOString()}_${dataType}`;
    
    // Check cache first
    const cached = await this.dataCache.get(cacheKey);
    if (cached && !this.isCacheStale(cached)) {
      return cached;
    }

    try {
      // Multiple data sources with fallback
      const dataSources = ['primary', 'secondary', 'backup'];
      
      for (const source of dataSources) {
        try {
          const data = await this.fetchFromSource(source, symbol, startDate, endDate, dataType);
          
          // Validate data quality
          if (this.validateDataQuality(data)) {
            await this.dataCache.set(cacheKey, data);
            return data;
          }
          
        } catch (error) {
          console.warn(`Data source ${source} failed:`, error);
          continue; // Try next source
        }
      }
      
      throw new Error('All data sources failed');
      
    } catch (error) {
      console.error('Historical data loading failed:', error);
      
      // Return cached data even if stale as fallback
      if (cached) {
        console.warn('Using stale cached data as fallback');
        return cached;
      }
      
      throw error;
    }
  }

  // Real-time WebSocket Data with Auto-Reconnection
  async subscribeToRealTimeData(symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      await this.establishWebSocketConnection(symbol);
    }
  }

  private async establishWebSocketConnection(symbol: string): Promise<void> {
    const config = ConfigurationManager.getInstance().getConfig();
    const wsUrl = `${config.marketData.streaming}/${symbol}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`WebSocket connected for ${symbol}`);
      this.subscribeToSymbol(ws, symbol);
    };
    
    ws.onmessage = (event) => {
      this.handleRealTimeData(symbol, JSON.parse(event.data));
    };
    
    ws.onerror = (error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
    };
    
    ws.onclose = () => {
      console.log(`WebSocket closed for ${symbol}`);
      // Auto-reconnect with exponential backoff
      this.scheduleReconnection(symbol);
    };
    
    this.wsConnections.set(symbol, ws);
  }

  private handleRealTimeData(symbol: string, data: any): void {
    try {
      // Validate incoming data
      if (!this.validateRealTimeData(data)) {
        console.warn('Invalid real-time data received:', data);
        return;
      }
      
      // Apply rate limiting
      if (!this.rateLimiter.canProcess()) {
        console.warn('Rate limit exceeded, dropping data');
        return;
      }
      
      // Process and emit data
      const processedData = this.processRealTimeData(symbol, data);
      EventBus.emit('realTimeDataUpdate', { symbol, data: processedData });
      
      // Update cache
      this.dataCache.updateRealTime(symbol, processedData);
      
    } catch (error) {
      console.error('Real-time data processing failed:', error);
    }
  }

  // CSV/Parquet File Loading for Backtesting
  async loadFromFile(filePath: string, format: 'csv' | 'parquet' | 'json'): Promise<any[]> {
    try {
      switch (format) {
        case 'csv':
          return await this.loadCSVFile(filePath);
        case 'parquet':
          return await this.loadParquetFile(filePath);
        case 'json':
          return await this.loadJSONFile(filePath);
        default:
          throw new Error(`Unsupported file format: ${format}`);
      }
    } catch (error) {
      console.error(`Failed to load file ${filePath}:`, error);
      throw error;
    }
  }

  private async loadCSVFile(filePath: string): Promise<any[]> {
    const fs = require('fs').promises;
    const csv = require('csv-parser');
    
    const data: any[] = [];
    
    return new Promise((resolve, reject) => {
      require('fs').createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: any) => {
          // Validate and transform row
          const transformedRow = this.transformCSVRow(row);
          if (transformedRow) {
            data.push(transformedRow);
          }
        })
        .on('end', () => {
          console.log(`Loaded ${data.length} rows from ${filePath}`);
          resolve(data);
        })
        .on('error', reject);
    });
  }
}

// Rate Limiting Implementation
class RateLimiter {
  private requests: number[] = [];
  private maxRequestsPerSecond: number;
  private maxRequestsPerMinute: number;

  constructor(config: { perSecond: number; perMinute: number }) {
    this.maxRequestsPerSecond = config.perSecond;
    this.maxRequestsPerMinute = config.perMinute;
  }

  canProcess(): boolean {
    const now = Date.now();
    
    // Clean old requests
    this.requests = this.requests.filter(time => now - time < 60000);
    
    // Check per-second limit
    const recentRequests = this.requests.filter(time => now - time < 1000);
    if (recentRequests.length >= this.maxRequestsPerSecond) {
      return false;
    }
    
    // Check per-minute limit
    if (this.requests.length >= this.maxRequestsPerMinute) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

// Retry Manager with Exponential Backoff
class RetryManager {
  constructor(private config: { maxRetries: number; baseDelay: number }) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.baseDelay * Math.pow(2, attempt);
          console.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
          await this.delay(delay);
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
