// Yahoo Finance v8 chart API via CORS proxies for real NSE/BSE data
// Symbols use .NS suffix for NSE, .BO for BSE

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

let currentProxyIdx = 0;

function getProxiedUrl(url: string): string {
  const proxy = CORS_PROXIES[currentProxyIdx % CORS_PROXIES.length];
  return proxy(url);
}

function rotateProxy() {
  currentProxyIdx++;
}

export interface YahooChartResult {
  symbol: string;
  currency: string;
  regularMarketPrice: number;
  previousClose: number;
  chartPreviousClose: number;
  regularMarketTime: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamps: number[];
  closePrices: number[];
  volumes: number[];
}

export interface IndexQuote {
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function fetchStockQuote(symbol: string): Promise<YahooChartResult | null> {
  const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
  const encodedSymbol = encodeURIComponent(yahooSymbol);
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?range=1d&interval=5m&includePrePost=false`;

  // Try with each proxy
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const proxiedUrl = getProxiedUrl(baseUrl);
      const res = await fetchWithTimeout(proxiedUrl);

      if (!res.ok) {
        rotateProxy();
        continue;
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        rotateProxy();
        continue;
      }

      const meta = result.meta;
      const timestamps: number[] = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};
      const closePrices: number[] = (quotes.close || []).map((v: number | null) => v ?? 0);
      const vols: number[] = (quotes.volume || []).map((v: number | null) => v ?? 0);

      return {
        symbol: meta.symbol || yahooSymbol,
        currency: meta.currency || 'INR',
        regularMarketPrice: meta.regularMarketPrice ?? 0,
        previousClose: meta.previousClose ?? meta.chartPreviousClose ?? 0,
        chartPreviousClose: meta.chartPreviousClose ?? 0,
        regularMarketTime: meta.regularMarketTime ?? 0,
        regularMarketVolume: meta.regularMarketVolume ?? vols.reduce((a: number, b: number) => a + b, 0),
        regularMarketDayHigh: meta.regularMarketDayHigh ?? Math.max(...closePrices.filter(Boolean)),
        regularMarketDayLow: meta.regularMarketDayLow ?? Math.min(...closePrices.filter((p: number) => p > 0)),
        regularMarketOpen: closePrices.find((p: number) => p > 0) ?? meta.regularMarketPrice,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
        timestamps,
        closePrices,
        volumes: vols,
      };
    } catch {
      rotateProxy();
      continue;
    }
  }

  return null;
}

export async function fetchIndexQuote(yahooSymbol: string): Promise<IndexQuote | null> {
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=15m`;

  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const proxiedUrl = getProxiedUrl(baseUrl);
      const res = await fetchWithTimeout(proxiedUrl);
      if (!res.ok) { rotateProxy(); continue; }

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) { rotateProxy(); continue; }

      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose ?? meta.chartPreviousClose;
      const change = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        price: Math.round(price * 100) / 100,
        previousClose: Math.round(prevClose * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePct: Math.round(changePct * 100) / 100,
      };
    } catch {
      rotateProxy();
      continue;
    }
  }
  return null;
}

// Batch fetch multiple stocks with delays to respect rate limits
export async function fetchStocksBatch(
  symbols: string[],
  batchSize = 3,
  delayMs = 1500,
  onProgress?: (symbol: string, result: YahooChartResult | null) => void,
): Promise<Map<string, YahooChartResult>> {
  const results = new Map<string, YahooChartResult>();

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(async (sym) => {
      const result = await fetchStockQuote(sym);
      if (result) results.set(sym, result);
      onProgress?.(sym, result);
      return { sym, result };
    });

    await Promise.allSettled(promises);

    // Delay between batches (not after last batch)
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}
