
interface YahooFinanceQuote {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketTime: number;
}

interface YahooFinanceResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketVolume: number;
      regularMarketTime: number;
    }>;
  };
}

export class YahooFinanceService {
  private baseUrl = 'https://query1.finance.yahoo.com/v7/finance/quote';

  async getQuote(symbol: string): Promise<YahooFinanceQuote | null> {
    try {
      const response = await fetch(`${this.baseUrl}?symbols=${symbol}`);
      
      if (!response.ok) {
        console.error('Failed to fetch quote:', response.statusText);
        return null;
      }

      const data: YahooFinanceResponse = await response.json();
      
      if (!data.quoteResponse?.result?.[0]) {
        console.error('No quote data found for symbol:', symbol);
        return null;
      }

      const quote = data.quoteResponse.result[0];
      
      return {
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketVolume: quote.regularMarketVolume,
        regularMarketTime: quote.regularMarketTime
      };
    } catch (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
  }

  async getSPXQuote(): Promise<YahooFinanceQuote | null> {
    return this.getQuote('^SPX');
  }
}

export const yahooFinanceService = new YahooFinanceService();
