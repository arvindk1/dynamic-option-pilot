
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { paperTradingService } from '@/services/paperTrading';
import { CheckCircle, Clock, X, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  symbol: string;
  type: 'PUT' | 'CALL';
  shortStrike: number;
  longStrike: number;
  quantity: number;
  entryCredit: number;
  entryDate: Date;
  expiration: Date;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  exitPrice?: number;
  exitDate?: Date;
  pnl?: number;
}

export const TradeManager: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [closingTrade, setClosingTrade] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = paperTradingService.subscribe(setTrades);
    setTrades(paperTradingService.getTrades());
    return unsubscribe;
  }, []);

  const handleCloseTrade = (tradeId: string) => {
    const price = parseFloat(exitPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid exit price",
        variant: "destructive",
      });
      return;
    }

    paperTradingService.closeTrade(tradeId, price);
    setClosingTrade(null);
    setExitPrice('');
    
    toast({
      title: "Trade Closed",
      description: "Position has been successfully closed",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-900 text-blue-300';
      case 'CLOSED': return 'bg-green-900 text-green-300';
      case 'EXPIRED': return 'bg-red-900 text-red-300';
      default: return 'bg-slate-900 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      case 'EXPIRED': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  const calculateDaysHeld = (entryDate: Date) => {
    return Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysToExpiration = (expiration: Date) => {
    return Math.floor((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          <span>Trade Management</span>
          <Badge variant="secondary" className="bg-blue-900 text-blue-300">
            {trades.filter(t => t.status === 'OPEN').length} Open
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No trades executed yet. Execute some spread candidates to see them here.
            </div>
          ) : (
            trades.map((trade) => (
              <div key={trade.id} className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
                  <div>
                    <div className="text-sm text-slate-400">Symbol</div>
                    <div className="font-bold">{trade.symbol}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Type</div>
                    <Badge variant={trade.type === 'PUT' ? 'secondary' : 'outline'}>
                      {trade.type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Strikes</div>
                    <div className="font-mono">{trade.shortStrike}/{trade.longStrike}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Quantity</div>
                    <div>{trade.quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Entry Credit</div>
                    <div className="text-green-400">${trade.entryCredit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">P&L</div>
                    <div className={trade.pnl && trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {trade.pnl ? `$${trade.pnl.toFixed(0)}` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Status</div>
                    <Badge variant="secondary" className={getStatusColor(trade.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(trade.status)}
                        <span>{trade.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div>
                    {trade.status === 'OPEN' && (
                      <div className="space-y-2">
                        {closingTrade === trade.id ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="Exit price"
                              value={exitPrice}
                              onChange={(e) => setExitPrice(e.target.value)}
                              className="bg-slate-800 border-slate-600 text-sm"
                            />
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                onClick={() => handleCloseTrade(trade.id)}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setClosingTrade(null)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => setClosingTrade(trade.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional trade info */}
                <div className="mt-3 pt-3 border-t border-slate-600 text-sm text-slate-400">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>Entry: {trade.entryDate.toLocaleDateString()}</div>
                    <div>Days Held: {calculateDaysHeld(trade.entryDate)}</div>
                    <div>Expiration: {trade.expiration.toLocaleDateString()}</div>
                    <div>DTE: {calculateDaysToExpiration(trade.expiration)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
