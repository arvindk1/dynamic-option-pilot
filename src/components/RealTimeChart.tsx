
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface RealTimeChartProps {
  data: any[];
  marketData: {
    price: number;
    volume: number;
    change: number;
    changePercent: number;
    timestamp: Date;
  };
  isMarketOpen?: boolean;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ data, marketData, isMarketOpen = false }) => {
  const isPositive = marketData.change >= 0;

  return (
    <div className="space-y-6">
      {/* Live Market Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  ${marketData.price.toFixed(2)}
                </div>
                <div className="text-sm text-slate-200">SPX Price</div>
              </div>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{marketData.change.toFixed(2)}
                </div>
                <div className="text-sm text-slate-200">Change</div>
              </div>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{(marketData.changePercent * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-slate-200">Change %</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">
                  {marketData.volume.toLocaleString()}
                </div>
                <div className="text-sm text-slate-200">Volume</div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge variant={isMarketOpen ? "secondary" : "outline"}
                       className={isMarketOpen ? "bg-green-800 text-green-100" : "bg-red-800 text-red-100"}>
                  {isMarketOpen ? 'Market Open' : 'Market Closed'}
                </Badge>
                <div className="flex items-center text-xs text-slate-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {marketData.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real-Time Performance</span>
            <Badge variant="secondary" className="bg-blue-800 text-blue-100">
              Yahoo Finance API
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#3B82F6" 
                fill="url(#gradient)" 
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
