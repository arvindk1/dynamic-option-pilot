
import { useState, useEffect, useCallback } from 'react';
import { yahooFinanceService } from '@/services/yahooFinanceAPI';

interface RealTimeData {
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

interface PerformanceData {
  date: string;
  pnl: number;
  cumulative: number;
}

export const useRealTimeData = () => {
  const [marketData, setMarketData] = useState<RealTimeData>({
    price: 6005.00, // Start with current SPX price
    volume: 0,
    change: 0,
    changePercent: 0,
    timestamp: new Date()
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([
    { date: '2024-01', pnl: 2500, cumulative: 2500 },
    { date: '2024-02', pnl: 1800, cumulative: 4300 },
    { date: '2024-03', pnl: -800, cumulative: 3500 },
    { date: '2024-04', pnl: 3200, cumulative: 6700 },
    { date: '2024-05', pnl: 2100, cumulative: 8800 },
    { date: '2024-06', pnl: 1600, cumulative: 10400 }
  ]);

  const [accountValue, setAccountValue] = useState(108450);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const updateMarketData = useCallback(async () => {
    try {
      const quote = await yahooFinanceService.getSPXQuote();
      
      if (quote) {
        setMarketData({
          price: quote.regularMarketPrice,
          volume: quote.regularMarketVolume,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent / 100,
          timestamp: new Date(quote.regularMarketTime * 1000)
        });
        
        // Check if market is open (rough estimate based on data freshness)
        const dataAge = Date.now() - (quote.regularMarketTime * 1000);
        setIsMarketOpen(dataAge < 300000); // Consider fresh if less than 5 minutes old
      } else {
        // Fallback to simulated data if API fails
        setMarketData(prev => ({
          ...prev,
          price: prev.price + (Math.random() - 0.5) * 2,
          timestamp: new Date()
        }));
      }
    } catch (error) {
      console.error('Failed to update market data:', error);
      // Fallback to simulated data on error
      setMarketData(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 2,
        timestamp: new Date()
      }));
    }
  }, []);

  const addPerformancePoint = useCallback((pnl: number) => {
    const currentDate = new Date().toISOString().slice(0, 7);
    setPerformanceData(prev => {
      const lastPoint = prev[prev.length - 1];
      const newPoint = {
        date: currentDate,
        pnl,
        cumulative: lastPoint.cumulative + pnl
      };
      
      // Update account value
      setAccountValue(prev => prev + pnl);
      
      return [...prev, newPoint];
    });
  }, []);

  useEffect(() => {
    // Initial fetch
    updateMarketData();
    
    // Update every 30 seconds (Yahoo Finance has rate limits)
    const interval = setInterval(updateMarketData, 30000);
    
    return () => clearInterval(interval);
  }, [updateMarketData]);

  return {
    marketData,
    performanceData,
    accountValue,
    isMarketOpen,
    addPerformancePoint
  };
};
