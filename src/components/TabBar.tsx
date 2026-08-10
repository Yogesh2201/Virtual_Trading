import { BarChart2, Briefcase, ClipboardList, Star, PieChart } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import type { TabId } from '../types';
import { cn } from '../utils/cn';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'market',    label: 'Market',    icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'orders',    label: 'Orders',    icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'watchlist', label: 'Watchlist', icon: <Star className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
];

export default function TabBar() {
  const { activeTab, setActiveTab, orders, positions } = useTrading();

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700/50 sticky top-[5.25rem] z-40">
      <div className="max-w-[1800px] mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-1 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-500/10'
                  : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'orders' && pendingOrders > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  {pendingOrders}
                </span>
              )}
              {tab.id === 'portfolio' && positions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                  {positions.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
