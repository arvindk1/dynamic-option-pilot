import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  Database,
  BarChart3,
  Shield,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { RealTimeChart } from '@/components/RealTimeChart';
import { TradeManager } from '@/components/TradeManager';
import { SpreadExecutor } from '@/components/SpreadExecutor';

interface TradingConfig {
  brokerPlugin: string;
  paperTrading: boolean;
  symbol: string;
  dteMin: number;
  dteMax: number;
  deltaTarget: number;
  creditThreshold: number;
  maxSpreadWidth: number;
  maxPositions: number;
  positionSizePct: number;
  maxMarginUsage: number;
  maxDrawdown: number;
  kellyFraction: number;
}

interface SpreadCandidate {
  id: string;
  shortStrike: number;
  longStrike: number;
  credit: number;
  maxLoss: number;
  delta: number;
  probabilityProfit: number;
  expectedValue: number;
  daysToExpiration: number;
  type: 'PUT' | 'CALL';
}

interface Position {
  id: string;
  symbol: string;
  type: 'PUT' | 'CALL';
  shortStrike: number;
  longStrike: number;
  quantity: number;
  entryCredit: number;
  currentValue: number;
  pnl: number;
  daysHeld: number;
  expiration: string;
}

const TradingDashboard = () => {
  const { marketData, performanceData, accountValue, isMarketOpen, addPerformancePoint } = useRealTimeData();
  
  const [config, setConfig] = useState<TradingConfig>({
    brokerPlugin: 'td_ameritrade',
    paperTrading: true,
    symbol: 'SPX',
    dteMin: 30,
    dteMax: 45,
    deltaTarget: 0.10,
    creditThreshold: 0.50,
    maxSpreadWidth: 50,
    maxPositions: 5,
    positionSizePct: 0.02,
    maxMarginUsage: 0.50,
    maxDrawdown: 0.15,
    kellyFraction: 0.25
  });

  const [marketBias, setMarketBias] = useState<'BULLISH' | 'NEUTRAL' | 'BEARISH'>('NEUTRAL');
  const [confidence, setConfidence] = useState(0.72);
  const [volatilityRegime, setVolatilityRegime] = useState<'HIGH_VOL' | 'NORMAL_VOL' | 'LOW_VOL'>('NORMAL_VOL');

  // Mock data
  const spreadCandidates: SpreadCandidate[] = [
    {
      id: '1',
      type: 'PUT',
      shortStrike: 4700,
      longStrike: 4650,
      credit: 1250,
      maxLoss: 3750,
      delta: -0.12,
      probabilityProfit: 0.88,
      expectedValue: 825,
      daysToExpiration: 34
    },
    {
      id: '2',
      type: 'PUT',
      shortStrike: 4750,
      longStrike: 4700,
      credit: 1580,
      maxLoss: 3420,
      delta: -0.15,
      probabilityProfit: 0.85,
      expectedValue: 790,
      daysToExpiration: 34
    },
    {
      id: '3',
      type: 'CALL',
      shortStrike: 4950,
      longStrike: 5000,
      credit: 1100,
      maxLoss: 3900,
      delta: 0.11,
      probabilityProfit: 0.89,
      expectedValue: 680,
      daysToExpiration: 34
    }
  ];

  const currentPositions: Position[] = [
    {
      id: '1',
      symbol: 'SPX',
      type: 'PUT',
      shortStrike: 4700,
      longStrike: 4650,
      quantity: 2,
      entryCredit: 2500,
      currentValue: 1200,
      pnl: 1300,
      daysHeld: 18,
      expiration: '2024-07-19'
    },
    {
      id: '2',
      symbol: 'SPX',
      type: 'CALL',
      shortStrike: 4950,
      longStrike: 5000,
      quantity: 1,
      entryCredit: 1100,
      currentValue: 400,
      pnl: 700,
      daysHeld: 12,
      expiration: '2024-07-26'
    }
  ];

  const pluginStatus = [
    { name: 'Data Ingestion', status: 'active', lastUpdate: '2 min ago', plugin: 'td_ameritrade' },
    { name: 'Signal Engine', status: 'active', lastUpdate: '1 min ago', plugin: 'composite_signals' },
    { name: 'Trade Selector', status: 'active', lastUpdate: '30 sec ago', plugin: 'dynamic_spread_selector' },
    { name: 'Risk Manager', status: 'active', lastUpdate: '45 sec ago', plugin: 'portfolio_manager' },
    { name: 'Execution Engine', status: 'standby', lastUpdate: '5 min ago', plugin: 'paper_trader' }
  ];

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'BULLISH': return 'text-green-400';
      case 'BEARISH': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getBiasIcon = (bias: string) => {
    switch (bias) {
      case 'BULLISH': return <TrendingUp className="h-4 w-4" />;
      case 'BEARISH': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Options Trading System
            </h1>
            <p className="text-slate-400 mt-2">Advanced algorithmic options trading platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={config.paperTrading ? "secondary" : "destructive"} className="px-3 py-1">
              {config.paperTrading ? 'Paper Trading' : 'Live Trading'}
            </Badge>
            <Badge variant={isMarketOpen ? "secondary" : "outline"} 
                   className={isMarketOpen ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}>
              {isMarketOpen ? 'Market Open' : 'Market Closed'}
            </Badge>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">${accountValue.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Account Value</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="signals" className="data-[state=active]:bg-blue-600">Signals</TabsTrigger>
            <TabsTrigger value="trades" className="data-[state=active]:bg-blue-600">Trades</TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-blue-600">Positions</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-blue-600">Risk</TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600">Config</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Plugin Status */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <span>Plugin Orchestrator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {pluginStatus.map((plugin, index) => (
                    <div key={index} className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{plugin.name}</span>
                        <div className={`h-2 w-2 rounded-full ${plugin.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      </div>
                      <div className="text-xs text-slate-400 mb-1">{plugin.plugin}</div>
                      <div className="text-xs text-slate-500">{plugin.lastUpdate}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Real-time Market Data and Charts */}
            <RealTimeChart data={performanceData} marketData={marketData} isMarketOpen={isMarketOpen} />

            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    <span>Market Bias</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-slate-900 ${getBiasColor(marketBias)}`}>
                      {getBiasIcon(marketBias)}
                    </div>
                    <div>
                      <div className={`text-xl font-bold ${getBiasColor(marketBias)}`}>
                        {marketBias}
                      </div>
                      <div className="text-sm text-slate-400">
                        Confidence: {(confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={confidence * 100} className="mt-4" />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-orange-400" />
                    <span>Volatility Regime</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-2">
                      {volatilityRegime.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-slate-400">
                      IV Rank: 62nd percentile
                    </div>
                    <div className="text-sm text-slate-400">
                      VIX: 18.5
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <span>Portfolio Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total P&L</span>
                      <span className="text-green-400 font-bold">+$10,400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Win Rate</span>
                      <span className="text-blue-400">76%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sharpe Ratio</span>
                      <span className="text-purple-400">1.8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Drawdown</span>
                      <span className="text-yellow-400">-3.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">RSI Signal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">42.3</div>
                    <Badge variant="secondary" className="bg-green-900 text-green-300">Bullish</Badge>
                    <div className="text-sm text-slate-400 mt-2">Weight: 25%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">EMA Cross</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">+1</div>
                    <Badge variant="secondary" className="bg-green-900 text-green-300">Bullish</Badge>
                    <div className="text-sm text-slate-400 mt-2">Weight: 25%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">MACD</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">0</div>
                    <Badge variant="secondary" className="bg-yellow-900 text-yellow-300">Neutral</Badge>
                    <div className="text-sm text-slate-400 mt-2">Weight: 25%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Support/Resistance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">+1</div>
                    <Badge variant="secondary" className="bg-green-900 text-green-300">Bullish</Badge>
                    <div className="text-sm text-slate-400 mt-2">Weight: 25%</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Composite Signal Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-green-400 mb-2">BULLISH</div>
                  <div className="text-lg text-slate-400">Confidence: 72%</div>
                  <Progress value={72} className="w-1/2 mx-auto mt-4" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Weighted Score</div>
                    <div className="text-2xl font-bold text-green-400">+0.75</div>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Signal Strength</div>
                    <div className="text-2xl font-bold text-blue-400">Strong</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            <SpreadExecutor 
              spreadCandidates={spreadCandidates} 
              onTradeExecuted={addPerformancePoint}
            />
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            <TradeManager />
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span>Position Count</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">2 / 5</div>
                    <Progress value={40} className="mb-2" />
                    <div className="text-sm text-slate-400">Within limits</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <span>Margin Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">32%</div>
                    <Progress value={32} className="mb-2" />
                    <div className="text-sm text-slate-400">Below 50% limit</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-blue-400" />
                    <span>Max Drawdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2">3.2%</div>
                    <Progress value={21.3} className="mb-2" />
                    <div className="text-sm text-slate-400">Below 15% limit</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Risk Metrics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-2">1.8</div>
                    <div className="text-sm text-slate-400">Sharpe Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-2">0.25</div>
                    <div className="text-sm text-slate-400">Kelly Fraction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-2">$21,600</div>
                    <div className="text-sm text-slate-400">Available Buying Power</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400 mb-2">76%</div>
                    <div className="text-sm text-slate-400">Win Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Trading Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
                      <Input 
                        id="symbol"
                        value={config.symbol}
                        onChange={(e) => setConfig({...config, symbol: e.target.value})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="broker" className="text-slate-300">Broker Plugin</Label>
                      <Input 
                        id="broker"
                        value={config.brokerPlugin}
                        onChange={(e) => setConfig({...config, brokerPlugin: e.target.value})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="paper-trading"
                      checked={config.paperTrading}
                      onCheckedChange={(checked) => setConfig({...config, paperTrading: checked})}
                    />
                    <Label htmlFor="paper-trading" className="text-slate-300">Paper Trading Mode</Label>
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dte-min" className="text-slate-300">DTE Min</Label>
                      <Input 
                        id="dte-min"
                        type="number"
                        value={config.dteMin}
                        onChange={(e) => setConfig({...config, dteMin: parseInt(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dte-max" className="text-slate-300">DTE Max</Label>
                      <Input 
                        id="dte-max"
                        type="number"
                        value={config.dteMax}
                        onChange={(e) => setConfig({...config, dteMax: parseInt(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="delta-target" className="text-slate-300">Delta Target</Label>
                      <Input 
                        id="delta-target"
                        type="number"
                        step="0.01"
                        value={config.deltaTarget}
                        onChange={(e) => setConfig({...config, deltaTarget: parseFloat(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit-threshold" className="text-slate-300">Credit Threshold</Label>
                      <Input 
                        id="credit-threshold"
                        type="number"
                        step="0.01"
                        value={config.creditThreshold}
                        onChange={(e) => setConfig({...config, creditThreshold: parseFloat(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-positions" className="text-slate-300">Max Positions</Label>
                      <Input 
                        id="max-positions"
                        type="number"
                        value={config.maxPositions}
                        onChange={(e) => setConfig({...config, maxPositions: parseInt(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position-size" className="text-slate-300">Position Size %</Label>
                      <Input 
                        id="position-size"
                        type="number"
                        step="0.01"
                        value={config.positionSizePct}
                        onChange={(e) => setConfig({...config, positionSizePct: parseFloat(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-margin" className="text-slate-300">Max Margin Usage</Label>
                      <Input 
                        id="max-margin"
                        type="number"
                        step="0.01"
                        value={config.maxMarginUsage}
                        onChange={(e) => setConfig({...config, maxMarginUsage: parseFloat(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-drawdown" className="text-slate-300">Max Drawdown</Label>
                      <Input 
                        id="max-drawdown"
                        type="number"
                        step="0.01"
                        value={config.maxDrawdown}
                        onChange={(e) => setConfig({...config, maxDrawdown: parseFloat(e.target.value)})}
                        className="bg-slate-900 border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="kelly-fraction" className="text-slate-300">Kelly Fraction</Label>
                    <Input 
                      id="kelly-fraction"
                      type="number"
                      step="0.01"
                      value={config.kellyFraction}
                      onChange={(e) => setConfig({...config, kellyFraction: parseFloat(e.target.value)})}
                      className="bg-slate-900 border-slate-600"
                    />
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingDashboard;
