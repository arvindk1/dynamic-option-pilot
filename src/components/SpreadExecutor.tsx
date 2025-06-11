
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { paperTradingService } from '@/services/paperTrading';
import { useToast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';

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

interface SpreadExecutorProps {
  spreadCandidates: SpreadCandidate[];
  onTradeExecuted?: (pnl: number) => void;
}

export const SpreadExecutor: React.FC<SpreadExecutorProps> = ({ 
  spreadCandidates, 
  onTradeExecuted 
}) => {
  const { toast } = useToast();

  const handleExecuteTrade = (spread: SpreadCandidate) => {
    try {
      const trade = paperTradingService.executeTrade(spread, 1);
      
      toast({
        title: "Trade Executed!",
        description: `${spread.type} spread executed for $${spread.credit} credit`,
      });

      // Simulate immediate small profit for demo
      if (onTradeExecuted) {
        setTimeout(() => {
          onTradeExecuted(Math.random() * 200 + 50);
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Spread Candidates - Paper Trading</span>
          <Badge variant="secondary" className="bg-green-800 text-green-100">
            Live Execution
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {spreadCandidates.map((spread) => (
            <div key={spread.id} className="bg-slate-900 p-4 rounded-lg border border-slate-600">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
                <div>
                  <div className="text-sm text-slate-200">Type</div>
                  <Badge variant={spread.type === 'PUT' ? 'secondary' : 'outline'}>
                    {spread.type} Spread
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-slate-200">Strikes</div>
                  <div className="font-mono">{spread.shortStrike}/{spread.longStrike}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-200">Credit</div>
                  <div className="text-green-400 font-bold">${spread.credit}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-200">Max Loss</div>
                  <div className="text-red-400">${spread.maxLoss}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-200">Delta</div>
                  <div className="font-mono">{spread.delta.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-200">PoP</div>
                  <div className="text-blue-400">{(spread.probabilityProfit * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-slate-200">Expected Value</div>
                  <div className="text-purple-400">${spread.expectedValue}</div>
                </div>
                <div>
                  <Button 
                    size="sm" 
                    onClick={() => handleExecuteTrade(spread)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Execute
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
