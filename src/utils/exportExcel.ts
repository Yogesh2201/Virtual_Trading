import * as XLSX from 'xlsx';
import type { UserAccount, Position, Order, WatchlistItem, Stock } from '../types';
import { formatINRFull } from './format';

interface ExportPayload {
  user: Pick<UserAccount, 'username' | 'initialCapital' | 'balance' | 'createdAt'>;
  positions: Position[];
  orders: Order[];
  watchlist: WatchlistItem[];
  stocks?: Stock[];
  portfolioValue: number;
  totalInvested: number;
  totalPnl: number;
  overallReturn: number;
}

function sheetFromAOA(aoa: (string | number)[][]) {
  return XLSX.utils.aoa_to_sheet(aoa);
}

export function exportUserToExcel(payload: ExportPayload, filenamePrefix = 'NSE_Trading_Report') {
  const {
    user, positions, orders, watchlist,
    portfolioValue, totalInvested, totalPnl, overallReturn,
  } = payload;

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = [
    ['NSE Paper Trading Report'],
    ['Generated At', new Date().toLocaleString('en-IN')],
    [],
    ['Account'],
    ['Username', user.username],
    ['Account Created', new Date(user.createdAt).toLocaleString('en-IN')],
    ['Initial Capital', user.initialCapital],
    ['Cash Balance', user.balance],
    ['Invested Value', totalInvested],
    ['Portfolio Value', portfolioValue],
    ['Total P&L', totalPnl],
    ['Overall Return %', overallReturn],
    [],
    ['Holdings Count', positions.length],
    ['Orders Count', orders.length],
    ['Watchlist Count', watchlist.length],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(summary), 'Summary');

  // Holdings sheet
  const holdingsHeader = [
    'Symbol', 'Name', 'Qty', 'Avg Cost', 'CMP', 'Invested', 'Current Value', 'P&L', 'P&L %',
  ];
  const holdingsRows = positions.map(p => [
    p.symbol, p.name, p.qty, p.avgCost, p.currentPrice,
    p.investedValue, p.currentValue, p.pnl, p.pnlPct,
  ]);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA([holdingsHeader, ...holdingsRows]), 'Holdings');

  // Orders sheet
  const ordersHeader = [
    'Order ID', 'Date', 'Symbol', 'Name', 'Side', 'Order Type', 'Qty', 'Price',
    'Limit Price', 'Status', 'Executed At', 'Value',
  ];
  const orderRows = orders.map(o => [
    o.id,
    o.dateStr,
    o.symbol,
    o.name,
    o.type,
    o.orderType,
    o.qty,
    o.price,
    o.limitPrice ?? '',
    o.status,
    o.executedDateStr ?? '',
    Math.round(o.qty * o.price * 100) / 100,
  ]);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA([ordersHeader, ...orderRows]), 'Orders');

  // Watchlist sheet
  const wlHeader = ['Symbol', 'Name'];
  const wlRows = watchlist.map(w => [w.symbol, w.name]);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA([wlHeader, ...wlRows]), 'Watchlist');

  const safeName = user.username.replace(/[^a-zA-Z0-9_-]/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${safeName}_${date}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

export function getExportSummaryText(user: string, portfolioValue: number, pnl: number) {
  return `${user} | Portfolio ${formatINRFull(portfolioValue)} | P&L ${formatINRFull(pnl)}`;
}
