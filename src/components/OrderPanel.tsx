import { useState } from 'react';
import { ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatINRFull, formatNum } from '../utils/format';
import type { Stock } from '../types';
import { cn } from '../utils/cn';

interface Props {
  stock: Stock;
}

export default function OrderPanel({ stock }: Props) {
  const { placeOrder, balance, positions, showToast, marketOpen, marketLabel } = useTrading();
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [qty, setQty] = useState('1');
  const [limitPrice, setLimitPrice] = useState('');

  const position = positions.find(p => p.symbol === stock.symbol);
  const qtyNum = parseInt(qty) || 0;
  const price = orderType === 'MARKET'
    ? (orderSide === 'BUY' ? stock.ask : stock.bid)
    : (parseFloat(limitPrice) || stock.currentPrice);
  const totalCost = qtyNum * price;

  const canExecute = qtyNum > 0 && (
    orderSide === 'BUY' ? totalCost <= balance : (position && position.qty >= qtyNum)
  );

  const handleSubmit = () => {
    const result = placeOrder(
      stock.symbol,
      orderSide,
      orderType,
      qtyNum,
      orderType === 'LIMIT' ? parseFloat(limitPrice) || stock.currentPrice : undefined
    );
    if (result.success) {
      showToast(result.message, 'success');
      setQty('1');
      setLimitPrice('');
    } else {
      showToast(result.message, 'error');
    }
  };

  const quickQtys = [1, 5, 10, 25, 50, 100];

  return (
    <div className="bg-white dark:bg-surface-800/80 rounded-2xl border-2 border-surface-200/60 dark:border-surface-700/40 p-5 xl:sticky xl:top-[5.5rem] transition-colors"
      style={{ borderColor: orderSide === 'BUY' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-brand-500" />
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Place Order</h3>
        <span className="text-xs text-surface-400 ml-auto">
          {position ? `Holding: ${position.qty} shares` : 'No position'}
        </span>
      </div>

      {!marketOpen && (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          ⏱ <strong>{marketLabel}</strong> — Market orders will be saved as <strong>PENDING</strong> and auto-execute at market open (9:15 AM IST). You can cancel them from the Orders tab.
        </div>
      )}

      {/* Buy/Sell toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setOrderSide('BUY')}
          className={cn(
            'py-2.5 rounded-xl font-semibold text-sm transition-all',
            orderSide === 'BUY'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300'
          )}
        >
          BUY
        </button>
        <button
          onClick={() => setOrderSide('SELL')}
          className={cn(
            'py-2.5 rounded-xl font-semibold text-sm transition-all',
            orderSide === 'SELL'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
              : 'bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300'
          )}
        >
          SELL
        </button>
      </div>

      {/* Order type */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-surface-400 w-16">Type:</span>
        <div className="flex gap-2 flex-1">
          {(['MARKET', 'LIMIT'] as const).map(t => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                orderType === t
                  ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400'
                  : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-3">
        <label className="text-xs text-surface-400 mb-1.5 block">Quantity (Shares)</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={e => setQty(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="flex gap-1.5 mt-2">
          {quickQtys.map(q => (
            <button
              key={q}
              onClick={() => setQty(String(q))}
              className="flex-1 py-1 text-[11px] font-medium rounded-lg bg-surface-100 dark:bg-surface-700/50 text-surface-600 dark:text-surface-300 hover:bg-brand-100 dark:hover:bg-brand-500/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price */}
      {orderType === 'LIMIT' && (
        <div className="mb-3">
          <label className="text-xs text-surface-400 mb-1.5 block">Limit Price (₹)</label>
          <input
            type="number"
            step="0.05"
            value={limitPrice}
            onChange={e => setLimitPrice(e.target.value)}
            placeholder={`Current: ₹${formatNum(stock.currentPrice)}`}
            className="w-full px-3 py-2 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      )}

      {/* Order summary */}
      <div className="bg-surface-50 dark:bg-surface-900/40 rounded-xl p-3 mb-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-surface-400">Price per share</span>
          <span className="font-medium text-surface-900 dark:text-white">₹{formatNum(price)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-surface-400">Quantity</span>
          <span className="font-medium text-surface-900 dark:text-white">{qtyNum} shares</span>
        </div>
        <div className="border-t border-surface-200 dark:border-surface-700 pt-1.5" />
        <div className="flex justify-between text-sm">
          <span className="font-medium text-surface-600 dark:text-surface-300">
            {orderSide === 'BUY' ? 'Total Cost' : 'Total Proceeds'}
          </span>
          <span className="font-bold text-surface-900 dark:text-white">{formatINRFull(totalCost)}</span>
        </div>
        {orderSide === 'BUY' && (
          <div className="flex justify-between text-[11px]">
            <span className="text-surface-400">Available Balance</span>
            <span className={cn('font-medium', totalCost > balance ? 'text-red-500' : 'text-surface-500 dark:text-surface-400')}>
              {formatINRFull(balance)}
            </span>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canExecute}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
          !canExecute
            ? 'bg-surface-200 dark:bg-surface-700 text-surface-400 cursor-not-allowed'
            : orderSide === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
        )}
      >
        <ArrowRightLeft className="w-4 h-4" />
        {!marketOpen || orderType === 'LIMIT'
          ? `Place Pending ${orderSide} — ${stock.symbol}`
          : `${orderSide === 'BUY' ? 'Buy' : 'Sell'} ${stock.symbol} (Market)`
        }
      </button>
    </div>
  );
}
