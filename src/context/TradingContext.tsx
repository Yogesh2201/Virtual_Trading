import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTradingStore, type TradingStore } from '../store/useTradingStore';
import type { TabId, UserAccount, UserPublic } from '../types';
import {
  getAllUsersPublic,
  createUser,
  authenticateUser,
  deleteUser,
  getUserById,
  getSession,
  setSession,
  clearSession,
  getPasswordHint,
  getMaxUsers,
  getUserCount,
} from '../utils/userStorage';
import { exportUserToExcel } from '../utils/exportExcel';

interface AppState extends TradingStore {
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  selectedStock: string | null;
  setSelectedStock: (s: string | null) => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;

  // Auth
  currentUser: UserAccount | null;
  users: UserPublic[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  register: (username: string, password: string, hint: string, capital: number) => { success: boolean; message: string };
  removeUser: (userId: string) => { success: boolean; message: string; filename?: string };
  getHint: (username: string) => string | null;
  refreshUsers: () => void;
  maxUsers: number;
  userCount: number;
  exportPortfolio: () => string | null;
}

const TradingCtx = createContext<AppState | null>(null);

export function useTrading() {
  const ctx = useContext(TradingCtx);
  if (!ctx) throw new Error('useTrading must be inside TradingProvider');
  return ctx;
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserPublic[]>(() => getAllUsersPublic());
  const [authReady, setAuthReady] = useState(false);

  const store = useTradingStore(currentUser);

  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );
  const [activeTab, setActiveTab] = useState<TabId>('market');
  const [selectedStock, setSelectedStock] = useState<string | null>('RELIANCE');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Restore session
  useEffect(() => {
    const session = getSession();
    if (session?.userId) {
      const user = getUserById(session.userId);
      if (user) setCurrentUser(user);
    }
    setAuthReady(true);
  }, []);

  const toggleDarkMode = () => setDarkMode(p => !p);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const refreshUsers = useCallback(() => {
    setUsers(getAllUsersPublic());
  }, []);

  const login = useCallback((username: string, password: string) => {
    const result = authenticateUser(username, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setSession(result.user.id);
      setActiveTab('market');
      refreshUsers();
    }
    return { success: result.success, message: result.message };
  }, [refreshUsers]);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
    setActiveTab('market');
  }, []);

  const register = useCallback((username: string, password: string, hint: string, capital: number) => {
    const result = createUser(username, password, hint, capital);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setSession(result.user.id);
      setActiveTab('market');
      refreshUsers();
    }
    return { success: result.success, message: result.message };
  }, [refreshUsers]);

  const removeUser = useCallback((userId: string) => {
    const user = getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    // Export before delete
    let filename: string | undefined;
    try {
      const invested = (user.positions || []).reduce((s, p) => s + p.investedValue, 0);
      const current = (user.positions || []).reduce((s, p) => s + p.currentValue, 0);
      const pnl = current - invested;
      const portfolioValue = user.balance + current;
      const overallReturn = user.initialCapital > 0
        ? ((portfolioValue - user.initialCapital) / user.initialCapital) * 100
        : 0;

      filename = exportUserToExcel({
        user: {
          username: user.username,
          initialCapital: user.initialCapital,
          balance: user.balance,
          createdAt: user.createdAt,
        },
        positions: user.positions || [],
        orders: user.orders || [],
        watchlist: user.watchlist || [],
        portfolioValue,
        totalInvested: invested,
        totalPnl: pnl,
        overallReturn,
      }, 'NSE_Deleted_User_Report');
    } catch {
      // continue delete even if export fails
    }

    deleteUser(userId);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      clearSession();
    }
    refreshUsers();
    return { success: true, message: `User "${user.username}" deleted`, filename };
  }, [currentUser?.id, refreshUsers]);

  const getHint = useCallback((username: string) => getPasswordHint(username), []);

  const exportPortfolio = useCallback(() => {
    if (!currentUser) return null;
    try {
      const filename = exportUserToExcel({
        user: {
          username: currentUser.username,
          initialCapital: currentUser.initialCapital,
          balance: store.balance,
          createdAt: currentUser.createdAt,
        },
        positions: store.positions,
        orders: store.orders,
        watchlist: store.watchlist,
        portfolioValue: store.portfolioValue,
        totalInvested: store.totalInvested,
        totalPnl: store.totalPnl,
        overallReturn: store.overallReturn,
      });
      return filename;
    } catch {
      return null;
    }
  }, [currentUser, store.balance, store.positions, store.orders, store.watchlist, store.portfolioValue, store.totalInvested, store.totalPnl, store.overallReturn]);

  // When selected stock changes, refresh its data
  useEffect(() => {
    if (selectedStock && currentUser) {
      store.refreshStock(selectedStock);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock, currentUser?.id]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <TradingCtx.Provider value={{
      ...store,
      darkMode, toggleDarkMode,
      activeTab, setActiveTab,
      selectedStock, setSelectedStock,
      toast, showToast,
      currentUser,
      users,
      isAuthenticated: !!currentUser,
      login,
      logout,
      register,
      removeUser,
      getHint,
      refreshUsers,
      maxUsers: getMaxUsers(),
      userCount: getUserCount(),
      exportPortfolio,
    }}>
      {children}
    </TradingCtx.Provider>
  );
}
