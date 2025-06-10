
import { useState, useEffect, useCallback } from 'react';

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
    price: 4875.50,
    volume: 125000,
    change: 12.75,
    changePercent: 0.26,
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

  const updateMarketData = useCallback(() => {
    setMarketData(prev => ({
      ...prev,
      price: prev.price + (Math.random() - 0.5) * 5,
      volume: prev.volume + Math.floor(Math.random() * 1000),
      change: prev.change + (Math.random() - 0.5) * 2,
      changePercent: (prev.change + (Math.random() - 0.5) * 2) / prev.price,
      timestamp: new Date()
    }));
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
    const interval = setInterval(updateMarketData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [updateMarketData]);

  return {
    marketData,
    performanceData,
    accountValue,
    addPerformancePoint
  };
};
