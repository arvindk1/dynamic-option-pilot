
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

export class PaperTradingService {
  private trades: Trade[] = [];
  private listeners: ((trades: Trade[]) => void)[] = [];

  constructor() {
    // Initialize with some sample trades
    this.trades = [
      {
        id: '1',
        symbol: 'SPX',
        type: 'PUT',
        shortStrike: 4700,
        longStrike: 4650,
        quantity: 2,
        entryCredit: 2500,
        entryDate: new Date('2024-06-01'),
        expiration: new Date('2024-07-19'),
        status: 'OPEN'
      },
      {
        id: '2',
        symbol: 'SPX',
        type: 'CALL',
        shortStrike: 4950,
        longStrike: 5000,
        quantity: 1,
        entryCredit: 1100,
        entryDate: new Date('2024-06-15'),
        expiration: new Date('2024-07-26'),
        status: 'OPEN'
      }
    ];

    // Simulate position updates
    setInterval(() => {
      this.updatePositions();
    }, 5000);
  }

  executeTrade(spread: any, quantity: number): Trade {
    const trade: Trade = {
      id: Date.now().toString(),
      symbol: 'SPX',
      type: spread.type,
      shortStrike: spread.shortStrike,
      longStrike: spread.longStrike,
      quantity,
      entryCredit: spread.credit * quantity,
      entryDate: new Date(),
      expiration: new Date(Date.now() + spread.daysToExpiration * 24 * 60 * 60 * 1000),
      status: 'OPEN'
    };

    this.trades.push(trade);
    this.notifyListeners();
    return trade;
  }

  closeTrade(tradeId: string, exitPrice: number): void {
    const trade = this.trades.find(t => t.id === tradeId);
    if (trade && trade.status === 'OPEN') {
      trade.status = 'CLOSED';
      trade.exitPrice = exitPrice;
      trade.exitDate = new Date();
      trade.pnl = trade.entryCredit - exitPrice;
      this.notifyListeners();
    }
  }

  getTrades(): Trade[] {
    return [...this.trades];
  }

  getOpenTrades(): Trade[] {
    return this.trades.filter(t => t.status === 'OPEN');
  }

  private updatePositions(): void {
    this.trades.forEach(trade => {
      if (trade.status === 'OPEN') {
        // Simulate price movement for open positions
        const currentValue = trade.entryCredit * (0.8 + Math.random() * 0.4);
        trade.pnl = trade.entryCredit - currentValue;
      }
    });
    this.notifyListeners();
  }

  subscribe(listener: (trades: Trade[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getTrades()));
  }
}

export const paperTradingService = new PaperTradingService();
