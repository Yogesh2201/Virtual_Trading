import { TradingProvider, useTrading } from './context/TradingContext';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import MarketView from './components/MarketView';
import PortfolioView from './components/PortfolioView';
import OrdersView from './components/OrdersView';
import WatchlistView from './components/WatchlistView';
import AnalyticsView from './components/AnalyticsView';
import Toast from './components/Toast';

function Dashboard() {
  const { activeTab, dataStatus, isAuthenticated, marketOpen, marketLabel, currentUser } = useTrading();

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
      <Navbar />
      <TabBar />

      <main className="max-w-[1800px] mx-auto px-4 py-5">
        {activeTab === 'market' && <MarketView />}
        {activeTab === 'portfolio' && <PortfolioView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'watchlist' && <WatchlistView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      <Toast />

      <footer className="max-w-[1800px] mx-auto px-4 pb-8">
        <div className="border-t border-surface-200/60 dark:border-surface-700/40 pt-6">
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
              ⚠️ Paper Trading — Real Market Data, Virtual Money
              {currentUser ? ` · Logged in as ${currentUser.username}` : ''}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-500 leading-relaxed">
              Market status: <strong>{marketLabel}</strong>
              {marketOpen
                ? ' — Market orders execute instantly.'
                : ' — Market orders go to PENDING and auto-execute at open (9:15 AM IST, Mon–Fri).'}
              {' '}Live prices from Yahoo Finance.
              {dataStatus === 'live' ? ' ✅ Live data active.' : dataStatus === 'partial' ? ' ⚡ Partial live data.' : dataStatus === 'offline' ? ' ❌ API offline.' : ' ⏳ Loading...'}
              {' '}Data saved in your browser. Export Excel anytime from Portfolio.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <Dashboard />
    </TradingProvider>
  );
}
