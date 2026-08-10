import { useState, useCallback, useRef, useEffect } from 'react';
import { NIFTY500_STOCKS, NIFTY50_YAHOO, SENSEX_YAHOO, getYahooSymbol, type StockMeta } from '../data/indianStocks';
import { fetchStockQuote, fetchIndexQuote, type YahooChartResult } from '../services/api';
import type { Stock, PricePoint, Position, Order, WatchlistItem, UserAccount } from '../types';
import { isMarketOpen, getMarketStatus } from '../utils/marketHours';
import { saveUserPortfolio } from '../utils/userStorage';

const PRIORITY_SYMBOLS = [
  'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK','BHARTIARTL','SBIN','ITC',
  'HINDUNILVR','LT','KOTAKBANK','AXISBANK','BAJFINANCE','M&M','TATAMOTORS',
  'SUNPHARMA','TITAN','MARUTI','HCLTECH','WIPRO','NTPC','POWERGRID',
  'ADANIENT','TATASTEEL','ONGC','BPCL','JSWSTEEL','COALINDIA','DRREDDY',
  'CIPLA','NESTLEIND','BAJAJFINSV','INDUSINDBK','GRASIM','TATACONSUM',
  'BRITANNIA','EICHERMOT','HEROMOTOCO','HINDALCO','DIVISLAB','TECHM',
  'APOLLOHOSP','TATAPOWER','VEDL','ZOMATO','IRCTC','PAYTM','HAL','BEL',
];

function yahooToStock(meta: StockMeta, yahoo: YahooChartResult): Stock {
  const currentPrice = yahoo.regularMarketPrice;
  const prevClose = yahoo.previousClose || yahoo.chartPreviousClose || currentPrice;
  const change = Math.round((currentPrice - prevClose) * 100) / 100;
  const changePct = prevClose > 0 ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : 0;
  const open = yahoo.regularMarketOpen || currentPrice;
  const high = yahoo.regularMarketDayHigh || currentPrice;
  const low = yahoo.regularMarketDayLow || currentPrice;

  const history: PricePoint[] = [];
  if (yahoo.timestamps.length > 0) {
    for (let i = 0; i < yahoo.timestamps.length; i++) {
      const price = yahoo.closePrices[i];
      if (!price || price <= 0) continue;
      const ts = yahoo.timestamps[i] * 1000;
      const d = new Date(ts);
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      history.push({ time, timestamp: ts, price, volume: yahoo.volumes[i] || 0 });
    }
  }

  return {
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    exchange: 'NSE',
    lotSize: 1,
    basePrice: currentPrice,
    currentPrice: Math.round(currentPrice * 100) / 100,
    previousClose: Math.round(prevClose * 100) / 100,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    volume: yahoo.regularMarketVolume || 0,
    change,
    changePct,
    bid: Math.round((currentPrice - currentPrice * 0.0005) * 100) / 100,
    ask: Math.round((currentPrice + currentPrice * 0.0005) * 100) / 100,
    history,
  };
}

function createFallbackStock(meta: StockMeta): Stock {
  return {
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    exchange: 'NSE',
    lotSize: 1,
    basePrice: 0,
    currentPrice: 0,
    previousClose: 0,
    open: 0,
    high: 0,
    low: 0,
    volume: 0,
    change: 0,
    changePct: 0,
    bid: 0,
    ask: 0,
    history: [],
  };
}

export type DataStatus = 'loading' | 'live' | 'offline' | 'partial';

export function useTradingStore(user: UserAccount | null) {
  const [stocks, setStocks] = useState<Stock[]>(() => NIFTY500_STOCKS.map(createFallbackStock));
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [positions, setPositions] = useState<Position[]>(user?.positions ?? []);
  const [orders, setOrders] = useState<Order[]>(user?.orders ?? []);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(user?.watchlist ?? []);
  const [nifty, setNifty] = useState({ price: 0, previousClose: 0, change: 0, changePct: 0 });
  const [sensex, setSensex] = useState({ price: 0, previousClose: 0, change: 0, changePct: 0 });
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [liveSymbols, setLiveSymbols] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());
  const [marketLabel, setMarketLabel] = useState(getMarketStatus().label);

  const mountedRef = useRef(true);
  const stocksRef = useRef(stocks);
  const balanceRef = useRef(balance);
  const positionsRef = useRef(positions);
  const ordersRef = useRef(orders);
  const watchlistRef = useRef(watchlist);

  useEffect(() => { stocksRef.current = stocks; }, [stocks]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { positionsRef.current = positions; }, [positions]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { watchlistRef.current = watchlist; }, [watchlist]);

  // Load user portfolio when user changes
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setPositions([]);
      setOrders([]);
      setWatchlist([]);
      return;
    }
    setBalance(user.balance);
    setPositions(user.positions || []);
    setOrders(user.orders || []);
    setWatchlist(user.watchlist || []);
  }, [user?.id]);

  // Persist portfolio whenever it changes
  useEffect(() => {
    if (!user) return;
    saveUserPortfolio(user.id, { balance, positions, orders, watchlist });
  }, [user?.id, balance, positions, orders, watchlist]);

  // Market status ticker
  useEffect(() => {
    const tick = () => {
      const status = getMarketStatus();
      setMarketOpen(status.isOpen);
      setMarketLabel(status.label);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const fetchAndUpdateStock = useCallback(async (symbol: string) => {
    const meta = NIFTY500_STOCKS.find(s => s.symbol === symbol);
    if (!meta) return false;
    const result = await fetchStockQuote(getYahooSymbol(symbol));
    if (!result || !mountedRef.current) return false;
    setStocks(prev => prev.map(s => s.symbol === symbol ? yahooToStock(meta, result) : s));
    setLiveSymbols(prev => new Set([...prev, symbol]));
    return true;
  }, []);

  const fetchPriorityStocks = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    let successCount = 0;

    const [niftyData, sensexData] = await Promise.allSettled([
      fetchIndexQuote(NIFTY50_YAHOO),
      fetchIndexQuote(SENSEX_YAHOO),
    ]);
    if (niftyData.status === 'fulfilled' && niftyData.value && mountedRef.current) setNifty(niftyData.value);
    if (sensexData.status === 'fulfilled' && sensexData.value && mountedRef.current) setSensex(sensexData.value);

    const batchSize = 3;
    const delay = 2000;
    const symbolsToFetch = PRIORITY_SYMBOLS.filter(s => NIFTY500_STOCKS.some(stock => stock.symbol === s));

    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      if (!mountedRef.current) break;
      const batch = symbolsToFetch.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(async (sym) => {
        const meta = NIFTY500_STOCKS.find(s => s.symbol === sym);
        if (!meta) return;
        const result = await fetchStockQuote(getYahooSymbol(sym));
        if (result && mountedRef.current) {
          setStocks(prev => prev.map(s => s.symbol === sym ? yahooToStock(meta, result) : s));
          setLiveSymbols(prev => new Set([...prev, sym]));
          successCount++;
        }
      }));
      if (i + batchSize < symbolsToFetch.length && mountedRef.current) {
        await new Promise(r => setTimeout(r, delay));
      }
    }

    if (mountedRef.current) {
      setLastRefresh(new Date());
      setRefreshing(false);
      if (successCount === 0) setDataStatus('offline');
      else if (successCount < symbolsToFetch.length) setDataStatus('partial');
      else setDataStatus('live');
    }
  }, [refreshing]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPriorityStocks();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) fetchPriorityStocks();
    }, 90000);
    return () => clearInterval(interval);
  }, [fetchPriorityStocks, refreshing]);

  // Update positions with live prices
  useEffect(() => {
    if (positions.length === 0) return;
    setPositions(prev => prev.map(pos => {
      const stock = stocks.find(s => s.symbol === pos.symbol);
      if (!stock || stock.currentPrice === 0) return pos;
      const currentValue = pos.qty * stock.currentPrice;
      const investedValue = pos.qty * pos.avgCost;
      const pnl = currentValue - investedValue;
      const pnlPct = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
      return {
        ...pos,
        currentPrice: stock.currentPrice,
        currentValue: Math.round(currentValue * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
      };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks]);

  // Execute a single order against current state snapshots
  const executeOrderNow = useCallback((
    order: Order,
    stock: Stock,
    currentBalance: number,
    currentPositions: Position[],
  ): {
    success: boolean;
    message: string;
    balance: number;
    positions: Position[];
    executedOrder: Order;
  } => {
    const price = order.orderType === 'LIMIT' && order.limitPrice
      ? order.limitPrice
      : (order.type === 'BUY' ? stock.ask || stock.currentPrice : stock.bid || stock.currentPrice);
    const total = price * order.qty;

    if (order.type === 'BUY') {
      if (total > currentBalance) {
        return {
          success: false,
          message: 'Insufficient funds to execute pending buy',
          balance: currentBalance,
          positions: currentPositions,
          executedOrder: { ...order, status: 'REJECTED' },
        };
      }

      let nextPositions = [...currentPositions];
      const existing = nextPositions.find(p => p.symbol === order.symbol);
      if (existing) {
        const newQty = existing.qty + order.qty;
        const newAvgCost = ((existing.avgCost * existing.qty) + (price * order.qty)) / newQty;
        nextPositions = nextPositions.map(p => p.symbol === order.symbol ? {
          ...p,
          qty: newQty,
          avgCost: Math.round(newAvgCost * 100) / 100,
          investedValue: Math.round(newQty * newAvgCost * 100) / 100,
          currentValue: Math.round(newQty * stock.currentPrice * 100) / 100,
          currentPrice: stock.currentPrice,
          pnl: Math.round((stock.currentPrice - newAvgCost) * newQty * 100) / 100,
          pnlPct: Math.round(((stock.currentPrice - newAvgCost) / newAvgCost) * 10000) / 100,
        } : p);
      } else {
        nextPositions.push({
          symbol: order.symbol,
          name: order.name,
          qty: order.qty,
          avgCost: Math.round(price * 100) / 100,
          currentPrice: stock.currentPrice,
          investedValue: Math.round(total * 100) / 100,
          currentValue: Math.round(order.qty * stock.currentPrice * 100) / 100,
          pnl: Math.round((stock.currentPrice - price) * order.qty * 100) / 100,
          pnlPct: Math.round(((stock.currentPrice - price) / price) * 10000) / 100,
        });
      }

      const executed: Order = {
        ...order,
        price: Math.round(price * 100) / 100,
        status: 'EXECUTED',
        executedAt: Date.now(),
        executedDateStr: new Date().toLocaleString('en-IN'),
      };

      return {
        success: true,
        message: `Bought ${order.qty} ${order.symbol} at ₹${price.toFixed(2)}`,
        balance: Math.round((currentBalance - total) * 100) / 100,
        positions: nextPositions,
        executedOrder: executed,
      };
    }

    // SELL
    const position = currentPositions.find(p => p.symbol === order.symbol);
    if (!position || position.qty < order.qty) {
      return {
        success: false,
        message: 'Insufficient shares for pending sell',
        balance: currentBalance,
        positions: currentPositions,
        executedOrder: { ...order, status: 'REJECTED' },
      };
    }

    let nextPositions = [...currentPositions];
    const newQty = position.qty - order.qty;
    if (newQty === 0) {
      nextPositions = nextPositions.filter(p => p.symbol !== order.symbol);
    } else {
      nextPositions = nextPositions.map(p => p.symbol === order.symbol ? {
        ...p,
        qty: newQty,
        investedValue: Math.round(newQty * p.avgCost * 100) / 100,
        currentValue: Math.round(newQty * stock.currentPrice * 100) / 100,
        pnl: Math.round((stock.currentPrice - p.avgCost) * newQty * 100) / 100,
        pnlPct: Math.round(((stock.currentPrice - p.avgCost) / p.avgCost) * 10000) / 100,
      } : p);
    }

    const executed: Order = {
      ...order,
      price: Math.round(price * 100) / 100,
      status: 'EXECUTED',
      executedAt: Date.now(),
      executedDateStr: new Date().toLocaleString('en-IN'),
    };

    return {
      success: true,
      message: `Sold ${order.qty} ${order.symbol} at ₹${price.toFixed(2)}`,
      balance: Math.round((currentBalance + total) * 100) / 100,
      positions: nextPositions,
      executedOrder: executed,
    };
  }, []);

  // Auto-execute pending market orders when market opens
  const processPendingOrders = useCallback(() => {
    if (!isMarketOpen()) return 0;
    const pending = ordersRef.current.filter(o => o.status === 'PENDING' && o.orderType === 'MARKET');
    if (pending.length === 0) return 0;

    let bal = balanceRef.current;
    let pos = [...positionsRef.current];
    let nextOrders = [...ordersRef.current];
    let executedCount = 0;

    for (const order of pending) {
      const stock = stocksRef.current.find(s => s.symbol === order.symbol);
      if (!stock || stock.currentPrice === 0) continue;

      const result = executeOrderNow(order, stock, bal, pos);
      bal = result.balance;
      pos = result.positions;
      nextOrders = nextOrders.map(o => o.id === order.id ? result.executedOrder : o);
      if (result.success) executedCount++;
    }

    if (executedCount > 0 || nextOrders.some((o, i) => o !== ordersRef.current[i])) {
      setBalance(bal);
      setPositions(pos);
      setOrders(nextOrders);
    }
    return executedCount;
  }, [executeOrderNow]);

  // Check pending orders when market opens / prices update
  useEffect(() => {
    if (marketOpen) processPendingOrders();
  }, [marketOpen, stocks, processPendingOrders]);

  const placeOrder = useCallback((
    symbol: string,
    type: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    qty: number,
    limitPrice?: number,
  ) => {
    if (!user) return { success: false, message: 'Please login first' };
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return { success: false, message: 'Stock not found' };
    if (stock.currentPrice === 0) return { success: false, message: 'Price not available yet. Wait for live data.' };
    if (qty <= 0) return { success: false, message: 'Quantity must be greater than 0' };

    const open = isMarketOpen();
    const price = orderType === 'MARKET'
      ? (type === 'BUY' ? stock.ask : stock.bid)
      : (limitPrice || stock.currentPrice);

    // Outside market hours OR limit order → PENDING
    if (!open || orderType === 'LIMIT') {
      // Pre-validate funds/shares so pending orders aren't invalid
      if (type === 'BUY' && price * qty > balance) {
        return { success: false, message: 'Insufficient funds' };
      }
      if (type === 'SELL') {
        const position = positions.find(p => p.symbol === symbol);
        if (!position || position.qty < qty) {
          return { success: false, message: `Insufficient shares. You have ${position?.qty || 0} shares.` };
        }
      }

      const order: Order = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        symbol, name: stock.name, type, orderType, qty,
        price: Math.round(price * 100) / 100,
        limitPrice: orderType === 'LIMIT' ? (limitPrice || stock.currentPrice) : undefined,
        status: 'PENDING',
        timestamp: Date.now(),
        dateStr: new Date().toLocaleString('en-IN'),
      };
      setOrders(prev => [order, ...prev]);

      if (!open) {
        return {
          success: true,
          message: `Market is closed. ${type} order for ${qty} ${symbol} placed as PENDING and will auto-execute when market opens.`,
        };
      }
      return {
        success: true,
        message: `Limit ${type.toLowerCase()} order placed for ${qty} ${symbol} at ₹${(limitPrice || stock.currentPrice).toFixed(2)}`,
      };
    }

    // Market open + market order → execute immediately
    const draft: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      symbol, name: stock.name, type, orderType, qty,
      price: Math.round(price * 100) / 100,
      status: 'PENDING',
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString('en-IN'),
    };

    const result = executeOrderNow(draft, stock, balance, positions);
    if (!result.success) {
      return { success: false, message: result.message };
    }

    setBalance(result.balance);
    setPositions(result.positions);
    setOrders(prev => [result.executedOrder, ...prev]);
    return { success: true, message: result.message };
  }, [user, stocks, balance, positions, executeOrderNow]);

  const cancelOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };
    if (order.status !== 'PENDING') return { success: false, message: 'Only pending orders can be cancelled' };

    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'CANCELLED' as const } : o
    ));
    return { success: true, message: `Order ${orderId} cancelled` };
  }, [orders]);

  const addToWatchlist = useCallback((symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;
    setWatchlist(prev => {
      if (prev.find(w => w.symbol === symbol)) return prev;
      return [...prev, { symbol, name: stock.name }];
    });
  }, [stocks]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
  }, []);

  const resetAccount = useCallback(() => {
    if (!user) return;
    setBalance(user.initialCapital);
    setPositions([]);
    setOrders([]);
  }, [user]);

  const refreshStock = useCallback(async (symbol: string) => {
    await fetchAndUpdateStock(symbol);
  }, [fetchAndUpdateStock]);

  const refreshAll = useCallback(() => {
    if (!refreshing) fetchPriorityStocks();
  }, [fetchPriorityStocks, refreshing]);

  const initialCapital = user?.initialCapital ?? 0;
  const totalInvested = positions.reduce((s, p) => s + p.investedValue, 0);
  const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const portfolioValue = balance + totalCurrentValue;
  const overallReturn = initialCapital > 0 ? ((portfolioValue - initialCapital) / initialCapital) * 100 : 0;

  // Analytics helpers
  const maxGainStock = positions.length > 0
    ? [...positions].sort((a, b) => b.pnl - a.pnl)[0]
    : null;
  const maxLossStock = positions.length > 0
    ? [...positions].sort((a, b) => a.pnl - b.pnl)[0]
    : null;

  return {
    stocks,
    balance,
    positions,
    orders,
    watchlist,
    nifty,
    sensex,
    dataStatus,
    liveSymbols,
    lastRefresh,
    refreshing,
    marketOpen,
    marketLabel,
    placeOrder,
    cancelOrder,
    addToWatchlist,
    removeFromWatchlist,
    resetAccount,
    refreshStock,
    refreshAll,
    processPendingOrders,
    totalInvested,
    totalCurrentValue,
    totalPnl,
    totalPnlPct: Math.round(totalPnlPct * 100) / 100,
    portfolioValue: Math.round(portfolioValue * 100) / 100,
    overallReturn: Math.round(overallReturn * 100) / 100,
    initialBalance: initialCapital,
    maxGainStock,
    maxLossStock,
  };
}

export type TradingStore = ReturnType<typeof useTradingStore>;
