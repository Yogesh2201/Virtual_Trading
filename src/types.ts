export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  lotSize: number;
  basePrice: number;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  history: PricePoint[];
}

export interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
  volume: number;
}

export interface Position {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  investedValue: number;
  currentValue: number;
}

export interface Order {
  id: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  qty: number;
  price: number;
  limitPrice?: number;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  timestamp: number;
  dateStr: string;
  executedAt?: number;
  executedDateStr?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
}

export type TabId = 'market' | 'portfolio' | 'orders' | 'watchlist' | 'analytics';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // simple hash stored client-side
  passwordHint: string;
  initialCapital: number;
  balance: number;
  positions: Position[];
  orders: Order[];
  watchlist: WatchlistItem[];
  createdAt: number;
  lastLoginAt: number;
}

export interface UserPublic {
  id: string;
  username: string;
  passwordHint: string;
  initialCapital: number;
  createdAt: number;
  lastLoginAt: number;
}
