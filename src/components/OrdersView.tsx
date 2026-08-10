import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatINRFull } from '../utils/format';
import { cn } from '../utils/cn';

type FilterStatus = 'ALL' | 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';

const STATUS_CONFIG = {
  EXECUTED:  { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  PENDING:   { icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  CANCELLED: { icon: XCircle,      color: 'text-surface-400', bg: 'bg-surface-100 dark:bg-surface-700/50' },
  REJECTED:  { icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-500/10' },
};

export default function OrdersView() {
  const { orders, cancelOrder, showToast, marketOpen, marketLabel } = useTrading();
  const [filter, setFilter] = useState<FilterStatus>('ALL');

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const counts = {
    ALL: orders.length,
    EXECUTED: orders.filter(o => o.status === 'EXECUTED').length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    REJECTED: orders.filter(o => o.status === 'REJECTED').length,
  };

  const handleCancel = (orderId: string) => {
    const result = cancelOrder(orderId);
    showToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-4">
      {/* Market status notice */}
      {!marketOpen && (
        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          ⏱ <strong>{marketLabel}</strong> — New market orders will be saved as <strong>PENDING</strong> and auto-execute when NSE opens (9:15 AM IST, Mon–Fri). You can cancel pending orders anytime.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 p-2 overflow-x-auto">
        {(['ALL', 'EXECUTED', 'PENDING', 'CANCELLED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap',
              filter === s
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            )}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] rounded-full font-bold',
              filter === s ? 'bg-white/20 text-white' : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
            )}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200/60 dark:border-surface-700/40 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-surface-100 dark:divide-surface-700/30">
            {filtered.map(order => {
              const config = STATUS_CONFIG[order.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-colors"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0',
                    order.type === 'BUY'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                  )}>
                    <span>{order.type}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-surface-900 dark:text-white">{order.symbol}</span>
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1', config.bg, config.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                        {order.orderType}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5 truncate">{order.name}</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">
                      Placed: {order.dateStr}
                      {order.executedDateStr && ` · Executed: ${order.executedDateStr}`}
                    </p>
                    <p className="text-[10px] text-surface-400 font-mono mt-0.5">{order.id}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">
                      {order.qty} × ₹{order.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {formatINRFull(order.qty * order.price)}
                    </p>
                    {order.limitPrice && (
                      <p className="text-[10px] text-purple-500">Limit: ₹{order.limitPrice.toFixed(2)}</p>
                    )}
                  </div>

                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex-shrink-0"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Cancel Order
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <Clock className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {filter === 'ALL' ? 'No orders placed yet' : `No ${filter.toLowerCase()} orders`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
