import { TrendingUp, TrendingDown, Wallet, PieChart, IndianRupee, Activity, Download, FileSpreadsheet } from 'lucide-react';
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTrading } from '../context/TradingContext';
import { formatINR, formatINRFull, formatPct, formatNum } from '../utils/format';
import { cn } from '../utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#e11d48', '#84cc16'];

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; pct: number } }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl p-3">
      <p className="text-sm font-medium text-surface-900 dark:text-white">{d.name}</p>
      <p className="text-xs text-surface-400">{formatINRFull(d.value)} ({d.pct.toFixed(1)}%)</p>
    </div>
  );
}

export default function PortfolioView() {
  const {
    balance, positions, portfolioValue,
    totalInvested, totalCurrentValue, totalPnl, totalPnlPct, overallReturn,
    setSelectedStock, setActiveTab, exportPortfolio, showToast, currentUser,
    initialBalance, orders,
  } = useTrading();

  const handleExport = () => {
    const filename = exportPortfolio();
    if (filename) showToast(`Excel exported: ${filename}`, 'success');
    else showToast('Failed to export Excel', 'error');
  };

  // Allocation data for donut
  const allocationData = positions.length > 0
    ? positions.map(p => ({
        name: p.symbol,
        value: p.currentValue,
        pct: (p.currentValue / totalCurrentValue) * 100,
      }))
    : [];

  // Add cash to allocation
  const fullAllocation = [
    ...allocationData,
    { name: 'Cash', value: balance, pct: (balance / portfolioValue) * 100 },
  ];

  const KPICard = ({ title, value, sub, icon, iconBg }: {
    title: string; value: string; sub?: React.ReactNode; icon: React.ReactNode; iconBg: string;
  }) => (
    <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">{title}</p>
      <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Portfolio Value"
          value={formatINR(portfolioValue)}
          icon={<IndianRupee className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-brand-500 to-brand-700"
          sub={
            <div className={cn('flex items-center gap-1 text-xs font-medium',
              overallReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {overallReturn >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPct(overallReturn)} overall
            </div>
          }
        />
        <KPICard
          title="Available Cash"
          value={formatINR(balance)}
          icon={<Wallet className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-purple-500 to-purple-700"
          sub={<p className="text-[11px] text-surface-400">{((balance / portfolioValue) * 100).toFixed(1)}% of portfolio</p>}
        />
        <KPICard
          title="Invested Value"
          value={formatINR(totalInvested)}
          icon={<PieChart className="w-5 h-5 text-white" />}
          iconBg="bg-gradient-to-br from-amber-500 to-amber-700"
          sub={<p className="text-[11px] text-surface-400">Current: {formatINR(totalCurrentValue)}</p>}
        />
        <KPICard
          title="Total P&L"
          value={`${totalPnl >= 0 ? '+' : ''}${formatINR(totalPnl)}`}
          icon={<Activity className="w-5 h-5 text-white" />}
          iconBg={totalPnl >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}
          sub={
            <div className={cn('flex items-center gap-1 text-xs font-medium',
              totalPnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {totalPnlPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPct(totalPnlPct)}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Holdings table */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 overflow-hidden">
          <div className="p-4 border-b border-surface-200/60 dark:border-surface-700/40 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
                Holdings ({positions.length})
              </h3>
              <p className="text-[11px] text-surface-400 mt-0.5">
                {currentUser?.username} · Start capital {formatINR(initialBalance)} · {orders.length} orders
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>
          {positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-900/40">
                    {['Stock', 'Qty', 'Avg Cost', 'CMP', 'Invested', 'Current', 'P&L', 'P&L %'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-[11px] font-semibold text-surface-400 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-700/30">
                  {positions.map(p => (
                    <tr
                      key={p.symbol}
                      className="hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer transition-colors"
                      onClick={() => { setSelectedStock(p.symbol); setActiveTab('market'); }}
                    >
                      <td className="px-3 py-2.5">
                        <span className="text-sm font-semibold text-surface-900 dark:text-white">{p.symbol}</span>
                        <p className="text-[11px] text-surface-400 truncate max-w-[120px]">{p.name}</p>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-surface-900 dark:text-white">{p.qty}</td>
                      <td className="px-3 py-2.5 text-sm text-surface-900 dark:text-white">₹{formatNum(p.avgCost)}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-surface-900 dark:text-white">₹{formatNum(p.currentPrice)}</td>
                      <td className="px-3 py-2.5 text-sm text-surface-500 dark:text-surface-400">{formatINR(p.investedValue)}</td>
                      <td className="px-3 py-2.5 text-sm text-surface-900 dark:text-white">{formatINR(p.currentValue)}</td>
                      <td className={cn('px-3 py-2.5 text-sm font-semibold',
                        p.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {p.pnl >= 0 ? '+' : ''}₹{formatNum(Math.abs(p.pnl))}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-1 rounded-lg',
                          p.pnlPct >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                        )}>
                          {formatPct(p.pnlPct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Wallet className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">No holdings yet</p>
              <button
                onClick={() => setActiveTab('market')}
                className="text-xs font-medium text-brand-500 hover:text-brand-600"
              >
                Start trading →
              </button>
            </div>
          )}
        </div>

        {/* Allocation donut */}
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-5">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-1">Allocation</h3>
          <p className="text-xs text-surface-400 mb-4">Portfolio composition</p>

          {fullAllocation.length > 1 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={fullAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={600}
                      stroke="none"
                    >
                      {fullAllocation.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {fullAllocation.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-surface-600 dark:text-surface-300">{item.name}</span>
                    </div>
                    <span className="font-medium text-surface-900 dark:text-white">{item.pct.toFixed(1)}%</span>
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
    </div>
  );
}
