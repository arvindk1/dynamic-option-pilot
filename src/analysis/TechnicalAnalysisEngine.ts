// src/analysis/TechnicalAnalysisEngine.ts
import { RSI, MACD, EMA, ATR, BollingerBands } from 'trading-signals';

class AdvancedTechnicalAnalysis {
  private indicators: Map<string, any> = new Map();
  private compositeFramework: CompositeIndicatorFramework;

  constructor() {
    this.compositeFramework = new CompositeIndicatorFramework();
    this.initializeIndicators();
  }

  private initializeIndicators(): void {
    // Primary indicators
    this.indicators.set('rsi', new RSI(14));
    this.indicators.set('macd', new MACD(12, 26, 9));
    this.indicators.set('ema20', new EMA(20));
    this.indicators.set('ema50', new EMA(50));
    this.indicators.set('atr', new ATR(14));
    this.indicators.set('bb', new BollingerBands(20, 2));
  }

  async analyzeMarket(priceData: PriceBar[]): Promise<MarketAnalysis> {
    const analysis: MarketAnalysis = {
      trend: await this.analyzeTrend(priceData),
      momentum: await this.analyzeMomentum(priceData),
      volatility: await this.analyzeVolatility(priceData),
      support: await this.findSupportLevels(priceData),
      resistance: await this.findResistanceLevels(priceData),
      regime: await this.determineVolatilityRegime(priceData),
      composite: await this.generateCompositeScore(priceData)
    };

    return analysis;
  }

  private async analyzeVolatility(priceData: PriceBar[]): Promise<VolatilityAnalysis> {
    const atr = this.indicators.get('atr');
    const bb = this.indicators.get('bb');
    
    // Update indicators with recent data
    priceData.slice(-20).forEach(bar => {
      atr.update({ high: bar.high, low: bar.low, close: bar.close });
      bb.update(bar.close);
    });

    const currentATR = atr.getResult();
    const currentBB = bb.getResult();
    
    // Calculate volatility percentile
    const atrHistory = this.getATRHistory(252); // 1 year
    const atrPercentile = this.calculatePercentile(currentATR, atrHistory);

    return {
      current: currentATR,
      percentile: atrPercentile,
      regime: this.classifyVolatilityRegime(atrPercentile),
      bollingerBandWidth: (currentBB.upper - currentBB.lower) / currentBB.middle,
      expansion: this.detectVolatilityExpansion(atrHistory)
    };
  }

  private async findSupportResistanceLevels(priceData: PriceBar[]): Promise<{support: number[], resistance: number[]}> {
    // Statistical Pivot Detection
    const pivots = this.findStatisticalPivots(priceData, 20); // 20-period lookback
    
    // Volume Profile Analysis
    const volumeProfile = this.calculateVolumeProfile(priceData);
    const volumeNodes = this.findVolumeNodes(volumeProfile);
    
    // Combine pivot and volume analysis
    const supportLevels = this.identifySupportLevels(pivots, volumeNodes);
    const resistanceLevels = this.identifyResistanceLevels(pivots, volumeNodes);
    
    return {
      support: supportLevels.slice(0, 3), // Top 3 support levels
      resistance: resistanceLevels.slice(0, 3) // Top 3 resistance levels
    };
  }

  private findStatisticalPivots(priceData: PriceBar[], period: number): PivotPoint[] {
    const pivots: PivotPoint[] = [];
    
    for (let i = period; i < priceData.length - period; i++) {
      const current = priceData[i];
      const leftBars = priceData.slice(i - period, i);
      const rightBars = priceData.slice(i + 1, i + period + 1);
      
      // Check for pivot high
      const isHighPivot = leftBars.every(bar => bar.high <= current.high) &&
                         rightBars.every(bar => bar.high <= current.high);
      
      // Check for pivot low
      const isLowPivot = leftBars.every(bar => bar.low >= current.low) &&
                        rightBars.every(bar => bar.low >= current.low);
      
      if (isHighPivot) {
        pivots.push({
          price: current.high,
          type: 'resistance',
          timestamp: current.timestamp,
          strength: this.calculatePivotStrength(priceData, i, 'high')
        });
      }
      
      if (isLowPivot) {
        pivots.push({
          price: current.low,
          type: 'support',
          timestamp: current.timestamp,
          strength: this.calculatePivotStrength(priceData, i, 'low')
        });
      }
    }
    
    return pivots.sort((a, b) => b.strength - a.strength);
  }
}

// Composite Indicator Framework
class CompositeIndicatorFramework {
  private weights: Map<string, number> = new Map();
  private signals: Map<string, number> = new Map();

  constructor() {
    // Default weights - can be adjusted based on backtesting
    this.weights.set('trend', 0.30);
    this.weights.set('momentum', 0.25);
    this.weights.set('volatility', 0.20);
    this.weights.set('volume', 0.15);
    this.weights.set('sentiment', 0.10);
  }

  addSignal(name: string, value: number, weight?: number): void {
    this.signals.set(name, this.normalizeSignal(value));
    if (weight !== undefined) {
      this.weights.set(name, weight);
    }
  }

  calculateCompositeScore(): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [name, signal] of this.signals) {
      const weight = this.weights.get(name) || 0;
      weightedSum += signal * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private normalizeSignal(value: number): number {
    // Normalize signals to -1 to +1 range
    return Math.max(-1, Math.min(1, value));
  }

  generateTradingSignal(): TradingRecommendation {
    const score = this.calculateCompositeScore();
    const confidence = Math.abs(score);
    
    let action: 'BUY' | 'SELL' | 'HOLD';
    if (score > 0.6) action = 'BUY';
    else if (score < -0.6) action = 'SELL';
    else action = 'HOLD';

    return {
      action,
      score,
      confidence,
      components: Object.fromEntries(this.signals),
      timestamp: Date.now()
    };
  }
}
