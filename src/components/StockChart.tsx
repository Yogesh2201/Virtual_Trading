import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import type { Stock } from '../types';
import { useTrading } from '../context/TradingContext';
import { formatNum } from '../utils/format';
import { Wifi, WifiOff } from 'lucide-react';

interface Props {
  stock: Stock;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { time: string; volume: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3 min-w-[140px]">
      <p className="text-xs text-surface-400 mb-1">{d.payload.time} IST</p>
      <p className="text-base font-bold text-surface-900 dark:text-white">₹{formatNum(d.value)}</p>
      {d.payload.volume > 0 && (
        <p className="text-[11px] text-surface-400 mt-0.5">Vol: {formatNum(d.payload.volume, 0)}</p>
      )}
    </div>
  );
}

export default function StockChart({ stock }: Props) {
  const { darkMode, liveSymbols } = useTrading();
  const hasData = stock.history.length > 0;
  const isLive = liveSymbols.has(stock.symbol);
  const isPositive = stock.changePct >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Intraday Chart</h3>
          <span className="flex items-center gap-1 text-xs text-surface-400">
            <WifiOff className="w-3 h-3" /> No chart data available
          </span>
        </div>
        <div className="h-[260px] flex items-center justify-center">
          <div className="text-center">
            <WifiOff className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
            <p className="text-sm text-surface-400">Chart data will appear when live market data is fetched</p>
            <p className="text-xs text-surface-500 mt-1">Market hours: 9:15 AM – 3:30 PM IST (Mon-Fri)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Intraday Chart</h3>
        <span className="flex items-center gap-1.5 text-xs text-surface-400">
          {isLive ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Live data</span>
              <span className="text-surface-400">• {stock.history.length} data points</span>
            </>
          ) : (
            <span>Cached data</span>
          )}
        </span>
      </div>
      <div className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stock.history} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={darkMode ? '#475569' : '#cbd5e1'}
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false} tickLine={false} minTickGap={40}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(v) => `₹${formatNum(v, 0)}`}
              stroke={darkMode ? '#475569' : '#cbd5e1'}
              tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
              axisLine={false} tickLine={false} width={65}
            />
            {stock.previousClose > 0 && (
              <ReferenceLine
                y={stock.previousClose}
                stroke={darkMode ? '#475569' : '#94a3b8'}
                strokeDasharray="4 4"
                label={{ value: 'Prev Close', fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 10, position: 'right' }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="price"
              stroke={color} strokeWidth={2}
              fill={`url(#grad-${stock.symbol})`}
              animationDuration={500} animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
