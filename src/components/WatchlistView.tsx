import { Star, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatNum, formatPct, formatVolume } from '../utils/format';
import { cn } from '../utils/cn';

export default function WatchlistView() {
  const { stocks, watchlist, removeFromWatchlist, setSelectedStock, setActiveTab } = useTrading();

  const watchedStocks = watchlist
    .map(w => stocks.find(s => s.symbol === w.symbol))
    .filter(Boolean) as typeof stocks;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 overflow-hidden">
        <div className="p-4 border-b border-surface-200/60 dark:border-surface-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
              My Watchlist ({watchedStocks.length})
            </h3>
          </div>
          <p className="text-xs text-surface-400">Click any stock to trade</p>
        </div>

        {watchedStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900/40">
                  {['Stock', 'Sector', 'LTP', 'Change', '% Change', 'Open', 'High', 'Low', 'Volume', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-surface-400 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                {watchedStocks.map(stock => (
                  <tr
                    key={stock.symbol}
                    className="hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer transition-colors"
                    onClick={() => { setSelectedStock(stock.symbol); setActiveTab('market'); }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-surface-900 dark:text-white">{stock.symbol}</span>
                      <p className="text-[11px] text-surface-400 truncate max-w-[140px]">{stock.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400">
                        {stock.sector}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-surface-900 dark:text-white">
                      ₹{formatNum(stock.currentPrice)}
                    </td>
                    <td className={cn('px-4 py-3 text-sm font-medium',
                      stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {stock.change >= 0 ? '+' : ''}₹{formatNum(stock.change)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
                        stock.changePct >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      )}>
                        {stock.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPct(stock.changePct)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">₹{formatNum(stock.open)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-500">₹{formatNum(stock.high)}</td>
                    <td className="px-4 py-3 text-sm text-red-500">₹{formatNum(stock.low)}</td>
                    <td className="px-4 py-3 text-sm text-surface-500 dark:text-surface-400">{formatVolume(stock.volume)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(stock.symbol); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <Star className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">Your watchlist is empty</p>
            <button
              onClick={() => setActiveTab('market')}
              className="text-xs font-medium text-brand-500 hover:text-brand-600"
            >
              Browse market to add stocks →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
