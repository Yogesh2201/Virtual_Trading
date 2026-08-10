import { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Star, ChevronRight, BarChart2, Wifi, ShoppingCart } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatNum, formatPct, formatVolume } from '../utils/format';
import { SECTORS } from '../data/indianStocks';
import { cn } from '../utils/cn';
import StockChart from './StockChart';
import OrderPanel from './OrderPanel';

export default function MarketView() {
  const { stocks, selectedStock, setSelectedStock, watchlist, addToWatchlist, removeFromWatchlist, liveSymbols, dataStatus } = useTrading();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'changePct' | 'volume' | 'name'>('changePct');

  const filtered = useMemo(() => {
    let result = [...stocks];
    // Show stocks with live data first; if searching, show all so user can find any stock
    if (!search) {
      // Put live stocks first, then alphabetical for non-live
      result.sort((a, b) => {
        const aLive = liveSymbols.has(a.symbol) ? 1 : 0;
        const bLive = liveSymbols.has(b.symbol) ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;
        return a.symbol.localeCompare(b.symbol);
      });
    }
    if (sectorFilter !== 'All') result = result.filter(s => s.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'changePct') result.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
    else if (sortBy === 'volume') result.sort((a, b) => b.volume - a.volume);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [stocks, search, sectorFilter, sortBy, liveSymbols]);

  const selected = stocks.find(s => s.symbol === selectedStock) || null;
  const isWatched = selectedStock ? watchlist.some(w => w.symbol === selectedStock) : false;

  const availableSectors = useMemo(() => {
    const sectorSet = new Set(stocks.map(s => s.sector));
    return SECTORS.filter(s => s === 'All' || sectorSet.has(s));
  }, [stocks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Stock list - left panel */}
      <div className="lg:col-span-4 xl:col-span-3 space-y-3">
        {/* Data status banner */}
        {dataStatus === 'offline' && (
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ Unable to fetch live data. Showing fallback prices.
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          {/* Sector pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {availableSectors.map(s => (
              <button
                key={s}
                onClick={() => setSectorFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all',
                  sectorFilter === s
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-surface-400">Sort:</span>
            {(['changePct', 'volume', 'name'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={cn('text-[11px] px-2 py-0.5 rounded-md transition-all',
                  sortBy === s ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-medium' : 'text-surface-500 dark:text-surface-400'
                )}>
                {s === 'changePct' ? '% Change' : s === 'volume' ? 'Volume' : 'Name'}
              </button>
            ))}
          </div>
        </div>

        {/* Stock list */}
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto">
          {filtered.map(stock => {
            const isLive = liveSymbols.has(stock.symbol);
            return (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700/30 transition-colors text-left',
                  selectedStock === stock.symbol
                    ? 'bg-brand-50 dark:bg-brand-500/10 border-l-2 border-l-brand-500'
                    : 'hover:bg-surface-50 dark:hover:bg-surface-700/20 border-l-2 border-l-transparent'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">
                      {stock.symbol}
                    </span>
                    {isLive && <Wifi className="w-2.5 h-2.5 text-emerald-500" />}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                      {stock.sector}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 truncate mt-0.5">{stock.name}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">
                    ₹{formatNum(stock.currentPrice)}
                  </p>
                  {stock.changePct !== 0 ? (
                    <p className={cn('text-xs font-medium flex items-center justify-end gap-0.5',
                      stock.changePct >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {stock.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {formatPct(stock.changePct)}
                    </p>
                  ) : (
                    <p className="text-xs text-surface-400">—</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600 ml-2 flex-shrink-0 hidden sm:block" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-surface-400">No stocks match your filters</div>
          )}
        </div>
      </div>

      {/* Right panel - Chart + Details + Order */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        {selected ? (
          <>
            {/* Stock Header */}
            <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">{selected.symbol}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 font-medium">
                      NSE
                    </span>
                    {liveSymbols.has(selected.symbol) && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-profit" />
                        LIVE
                      </span>
                    )}
                    <button
                      onClick={() => isWatched ? removeFromWatchlist(selected.symbol) : addToWatchlist(selected.symbol)}
                      className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
                    >
                      <Star className={cn('w-4 h-4', isWatched ? 'fill-amber-400 text-amber-400' : 'text-surface-400')} />
                    </button>
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{selected.name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                      ₹{formatNum(selected.currentPrice)}
                    </p>
                    {selected.changePct !== 0 ? (
                      <p className={cn('text-sm font-semibold flex items-center justify-end gap-1',
                        selected.changePct >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {selected.changePct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {selected.change >= 0 ? '+' : ''}₹{formatNum(selected.change)} ({formatPct(selected.changePct)})
                      </p>
                    ) : (
                      <p className="text-sm text-surface-400">Awaiting market data...</p>
                    )}
                  </div>
                  {/* Quick Buy / Sell buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStock(selected.symbol);
                        document.getElementById('order-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Buy
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStock(selected.symbol);
                        document.getElementById('order-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-500/20 transition-all"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-surface-200/60 dark:border-surface-700/40">
                {[
                  { label: 'Open', value: selected.open > 0 ? `₹${formatNum(selected.open)}` : '—' },
                  { label: 'Prev Close', value: selected.previousClose > 0 ? `₹${formatNum(selected.previousClose)}` : '—' },
                  { label: 'Day High', value: selected.high > 0 ? `₹${formatNum(selected.high)}` : '—' },
                  { label: 'Day Low', value: selected.low > 0 ? `₹${formatNum(selected.low)}` : '—' },
                  { label: 'Volume', value: selected.volume > 0 ? formatVolume(selected.volume) : '—' },
                  { label: 'Bid / Ask', value: selected.bid > 0 ? `₹${formatNum(selected.bid)} / ₹${formatNum(selected.ask)}` : '—' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p className="text-[11px] text-surface-400 dark:text-surface-500">{stat.label}</p>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart + Order side by side so Buy/Sell is always visible */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <StockChart stock={selected} />
              </div>
              <div id="order-panel">
                <OrderPanel stock={selected} />
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-16 text-center">
            <BarChart2 className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-surface-500 dark:text-surface-400">Select a stock to view details and trade</p>
          </div>
        )}
      </div>
    </div>
  );
}
