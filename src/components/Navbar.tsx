import {
  Sun, Moon, BarChart3, TrendingUp, TrendingDown,
  RotateCcw, Wallet, RefreshCw, Wifi, WifiOff, Loader2,
  LogOut, User, Clock,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatINR, formatNum, formatPct } from '../utils/format';
import { cn } from '../utils/cn';

export default function Navbar() {
  const {
    darkMode, toggleDarkMode, nifty, sensex,
    balance, portfolioValue, dataStatus, liveSymbols,
    refreshing, lastRefresh, refreshAll, resetAccount,
    currentUser, logout, marketOpen, marketLabel, showToast,
  } = useTrading();

  const statusConfig = {
    loading: { icon: Loader2, text: 'Loading live prices...', color: 'text-amber-400', spin: true },
    live:    { icon: Wifi,    text: `Live • ${liveSymbols.size} stocks`, color: 'text-emerald-400', spin: false },
    partial: { icon: Wifi,    text: `${liveSymbols.size} stocks loaded`, color: 'text-amber-400', spin: false },
    offline: { icon: WifiOff, text: 'Offline — try refresh', color: 'text-red-400', spin: false },
  };
  const status = statusConfig[dataStatus];
  const StatusIcon = status.icon;

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
  };

  const handleReset = () => {
    if (window.confirm('Reset this account portfolio? Balance returns to initial capital. Orders & holdings will be cleared.')) {
      resetAccount();
      showToast('Account portfolio reset', 'success');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700/50">
      {/* Top bar */}
      <div className="bg-surface-900 dark:bg-surface-950 text-white text-xs py-1.5 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 flex items-center gap-4 sm:gap-6 flex-wrap">
          {nifty.price > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="text-surface-400 font-medium">NIFTY 50</span>
              <span className="font-semibold">{formatNum(nifty.price, 2)}</span>
              <span className={cn('font-medium', nifty.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {nifty.change >= 0 ? '+' : ''}{formatNum(nifty.change, 2)} ({formatPct(nifty.changePct)})
              </span>
            </div>
          )}
          {sensex.price > 0 && (
            <>
              <div className="w-px h-4 bg-surface-700 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className="text-surface-400 font-medium">SENSEX</span>
                <span className="font-semibold">{formatNum(sensex.price, 2)}</span>
                <span className={cn('font-medium', sensex.change >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {sensex.change >= 0 ? '+' : ''}{formatNum(sensex.change, 2)} ({formatPct(sensex.changePct)})
                </span>
              </div>
            </>
          )}
          <div className="w-px h-4 bg-surface-700 hidden sm:block" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('w-2 h-2 rounded-full', marketOpen ? 'bg-emerald-400 pulse-profit' : 'bg-red-400')} />
            <Clock className="w-3 h-3 text-surface-400" />
            <span className={cn('text-[11px] font-medium', marketOpen ? 'text-emerald-400' : 'text-red-400')}>
              {marketLabel}
            </span>
          </div>
          <div className="w-px h-4 bg-surface-700 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <StatusIcon className={cn('w-3 h-3', status.color, status.spin && 'animate-spin')} />
            <span className={cn('text-[11px]', status.color)}>{status.text}</span>
          </div>
          {lastRefresh && (
            <span className="text-[10px] text-surface-500 hidden xl:inline">
              Updated: {lastRefresh.toLocaleTimeString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-surface-900 dark:text-white leading-none">
                NSE Paper Trading
              </h1>
              {dataStatus === 'live' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-white uppercase tracking-wider">
                  Live
                </span>
              )}
            </div>
            <p className="text-[10px] text-surface-400 mt-0.5">
              NIFTY 500 · Real market data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* User badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                {currentUser.username}
              </span>
            </div>
          )}

          {/* Balance */}
          <div className="hidden lg:flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl px-3 py-1.5">
            <Wallet className="w-3.5 h-3.5 text-surface-400" />
            <div className="text-xs">
              <span className="text-surface-500 dark:text-surface-400">Cash: </span>
              <span className="font-semibold text-surface-900 dark:text-white">{formatINR(balance)}</span>
            </div>
          </div>

          {/* Portfolio */}
          <div className="hidden xl:flex items-center gap-2 bg-surface-100 dark:bg-surface-800 rounded-xl px-3 py-1.5">
            {portfolioValue >= (currentUser?.initialCapital || 0)
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            }
            <div className="text-xs">
              <span className="text-surface-500 dark:text-surface-400">Portfolio: </span>
              <span className="font-semibold text-surface-900 dark:text-white">{formatINR(portfolioValue)}</span>
            </div>
          </div>

          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
            title="Refresh live data"
          >
            <RefreshCw className={cn('w-4 h-4 text-surface-400', refreshing && 'animate-spin text-brand-500')} />
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Reset Portfolio"
          >
            <RotateCcw className="w-4 h-4 text-surface-400" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-surface-400 hover:text-red-500" />
          </button>

          <button
            onClick={toggleDarkMode}
            className={cn(
              'relative w-12 h-6 rounded-full transition-colors duration-300',
              darkMode ? 'bg-brand-600' : 'bg-surface-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-300',
              darkMode ? 'translate-x-6' : 'translate-x-0.5'
            )}>
              {darkMode
                ? <Moon className="w-3 h-3 text-brand-600" />
                : <Sun className="w-3 h-3 text-amber-500" />
              }
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
