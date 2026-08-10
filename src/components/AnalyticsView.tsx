import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import { useTrading } from '../context/TradingContext';
import { formatINR, formatNum, formatPct as fmtPct } from '../utils/format';
import { cn } from '../utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#e11d48', '#84cc16'];

export default function AnalyticsView() {
  const {
    stocks, positions, orders, balance, portfolioValue, totalPnl, darkMode,
    maxGainStock, maxLossStock, setSelectedStock, setActiveTab,
  } = useTrading();

  // Sector performance
  const sectorPerf = useMemo(() => {
    const map = new Map<string, { count: number; totalChangePct: number }>();
    for (const s of stocks) {
      const existing = map.get(s.sector);
      if (existing) {
        existing.count++;
        existing.totalChangePct += s.changePct;
      } else {
        map.set(s.sector, { count: 1, totalChangePct: s.changePct });
      }
    }
    return Array.from(map.entries())
      .map(([sector, data]) => ({
        sector,
        avgChange: Math.round((data.totalChangePct / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  // Top gainers / losers today
  const sortedByChange = useMemo(() =>
    [...stocks].sort((a, b) => b.changePct - a.changePct),
    [stocks]
  );
  const topGainers = sortedByChange.slice(0, 5);
  const topLosers = sortedByChange.slice(-5).reverse();

  // Order history chart
  const orderHistory = useMemo(() => {
    const executedOrders = orders.filter(o => o.status === 'EXECUTED');
    const map = new Map<string, { buys: number; sells: number }>();
    for (const o of executedOrders) {
      const key = o.symbol;
      const existing = map.get(key) || { buys: 0, sells: 0 };
      if (o.type === 'BUY') existing.buys += o.qty * o.price;
      else existing.sells += o.qty * o.price;
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([symbol, data]) => ({
      symbol,
      buys: Math.round(data.buys),
      sells: Math.round(data.sells),
    }));
  }, [orders]);

  // Portfolio sector allocation
  const portfolioSectors = useMemo(() => {
    if (positions.length === 0) return [];
    const map = new Map<string, number>();
    for (const p of positions) {
      const stock = stocks.find(s => s.symbol === p.symbol);
      const sector = stock?.sector || 'Other';
      map.set(sector, (map.get(sector) || 0) + p.currentValue);
    }
    map.set('Cash', balance);
    const total = portfolioValue;
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      pct: (value / total) * 100,
    })).sort((a, b) => b.value - a.value);
  }, [positions, stocks, balance, portfolioValue]);

  // Market heat map data
  const heatmapData = useMemo(() => {
    return stocks.slice(0, 30).map(s => ({
      symbol: s.symbol,
      changePct: s.changePct,
      size: Math.max(Math.abs(s.changePct), 0.3),
    }));
  }, [stocks]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-4">
          <p className="text-xs text-surface-400 mb-1">Total Trades</p>
          <p className="text-xl font-bold text-surface-900 dark:text-white">{orders.filter(o => o.status === 'EXECUTED').length}</p>
        </div>
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-4">
          <p className="text-xs text-surface-400 mb-1">Win Rate</p>
          <p className="text-xl font-bold text-surface-900 dark:text-white">
            {positions.length > 0
              ? `${((positions.filter(p => p.pnl > 0).length / positions.length) * 100).toFixed(0)}%`
              : '—'
            }
          </p>
        </div>
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-4">
          <p className="text-xs text-surface-400 mb-1">Portfolio P&L</p>
          <p className={cn('text-xl font-bold', totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {totalPnl >= 0 ? '+' : ''}{formatINR(totalPnl)}
          </p>
        </div>
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-4">
          <p className="text-xs text-surface-400 mb-1">Pending Orders</p>
          <p className="text-xl font-bold text-amber-500">{orders.filter(o => o.status === 'PENDING').length}</p>
        </div>

        {/* Max Gain from single stock */}
        <button
          onClick={() => {
            if (maxGainStock) {
              setSelectedStock(maxGainStock.symbol);
              setActiveTab('market');
            }
          }}
          className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-500/10 dark:to-surface-800/80 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-4 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-medium">🚀 Max Gain (Single Stock)</p>
          {maxGainStock && maxGainStock.pnl > 0 ? (
            <>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{maxGainStock.symbol}</p>
              <p className="text-sm font-semibold text-emerald-500">+{formatINR(maxGainStock.pnl)} ({fmtPct(maxGainStock.pnlPct)})</p>
              <p className="text-[10px] text-surface-400 mt-1">Click to trade →</p>
            </>
          ) : (
            <p className="text-sm text-surface-400 mt-1">No profitable holdings yet</p>
          )}
        </button>

        {/* Max Loss from single stock */}
        <button
          onClick={() => {
            if (maxLossStock) {
              setSelectedStock(maxLossStock.symbol);
              setActiveTab('market');
            }
          }}
          className="bg-gradient-to-br from-red-50 to-white dark:from-red-500/10 dark:to-surface-800/80 rounded-2xl border border-red-200 dark:border-red-500/20 p-4 text-left hover:shadow-md transition-all"
        >
          <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium">📉 Max Loss (Single Stock)</p>
          {maxLossStock && maxLossStock.pnl < 0 ? (
            <>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{maxLossStock.symbol}</p>
              <p className="text-sm font-semibold text-red-500">{formatINR(maxLossStock.pnl)} ({fmtPct(maxLossStock.pnlPct)})</p>
              <p className="text-[10px] text-surface-400 mt-1">Click to trade →</p>
            </>
          ) : (
            <p className="text-sm text-surface-400 mt-1">No losing holdings</p>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sector Performance */}
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Sector Performance</h3>
          <p className="text-xs text-surface-400 mb-4">Average daily change by sector</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorPerf} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={v => `${v}%`}
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category" dataKey="sector"
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={75}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0];
                    return (
                      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3">
                        <p className="text-sm font-medium text-surface-900 dark:text-white">{d.payload.sector}</p>
                        <p className={cn('text-sm font-bold', Number(d.value) >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                          {fmtPct(Number(d.value))}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="avgChange"
                  radius={[0, 4, 4, 0]}
                  animationDuration={600}
                  fill="#6366f1"
                >
                  {sectorPerf.map((entry, i) => (
                    <Cell key={i} fill={entry.avgChange >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Sector Allocation</h3>
          <p className="text-xs text-surface-400 mb-4">Your portfolio by sector</p>
          {portfolioSectors.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolioSectors} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={2} dataKey="value" stroke="none" animationDuration={600}>
                      {portfolioSectors.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3">
                            <p className="text-sm font-medium text-surface-900 dark:text-white">{d.name}</p>
                            <p className="text-xs text-surface-400">{formatINR(d.value)} ({d.pct.toFixed(1)}%)</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {portfolioSectors.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-surface-500 dark:text-surface-400 truncate">{s.name}</span>
                    <span className="font-medium text-surface-900 dark:text-white ml-auto">{s.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-surface-400">Buy stocks to see allocation</p>
            </div>
          )}
        </div>
      </div>

      {/* Trade history bar chart */}
      {orderHistory.length > 0 && (
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Trade Volume by Stock</h3>
          <p className="text-xs text-surface-400 mb-4">Executed buy/sell amounts</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="symbol" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => formatINR(v)} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3">
                        <p className="text-sm font-medium text-surface-900 dark:text-white mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} className="text-xs text-surface-400">
                            {p.dataKey === 'buys' ? 'Buys' : 'Sells'}: {formatINR(Number(p.value))}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="buys" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={600} />
                <Bar dataKey="sells" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Market Heat Map */}
      <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Market Heat Map</h3>
        <p className="text-xs text-surface-400 mb-4">Top 30 stocks by daily change</p>
        <div className="flex flex-wrap gap-2">
          {heatmapData.map(d => (
            <div
              key={d.symbol}
              className={cn(
                'rounded-lg px-3 py-2 text-center transition-all cursor-default',
                d.changePct >= 1 ? 'bg-emerald-500 text-white' :
                d.changePct >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                d.changePct >= -1 ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                'bg-red-500 text-white'
              )}
              style={{ minWidth: `${Math.max(d.size * 25 + 50, 60)}px` }}
            >
              <p className="text-[11px] font-semibold">{d.symbol}</p>
              <p className="text-[10px] font-medium">{fmtPct(d.changePct)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-emerald-500 mb-3 flex items-center gap-2">
            🚀 Top Gainers
          </h3>
          <div className="space-y-2.5">
            {topGainers.map((s, i) => (
              <div key={s.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-500">{i + 1}</span>
                  <span className="text-sm font-medium text-surface-900 dark:text-white">{s.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-600 dark:text-surface-300">₹{formatNum(s.currentPrice)}</span>
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    {fmtPct(s.changePct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
            📉 Top Losers
          </h3>
          <div className="space-y-2.5">
            {topLosers.map((s, i) => (
              <div key={s.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-500">{i + 1}</span>
                  <span className="text-sm font-medium text-surface-900 dark:text-white">{s.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-surface-600 dark:text-surface-300">₹{formatNum(s.currentPrice)}</span>
                  <span className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-lg">
                    {fmtPct(s.changePct)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
