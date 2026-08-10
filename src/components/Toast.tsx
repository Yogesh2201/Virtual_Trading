import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { cn } from '../utils/cn';

export default function Toast() {
  const { toast } = useTrading();

  if (!toast) return null;

  const configs = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
      style: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
      style: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300',
    },
    info: {
      icon: <Info className="w-5 h-5 text-brand-500 flex-shrink-0" />,
      style: 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20 text-brand-800 dark:text-brand-300',
    },
  };

  const config = configs[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-[slideUp_0.3s_ease-out]">
      <div className={cn(
        'flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border min-w-[280px] max-w-[420px]',
        config.style,
      )}>
        {config.icon}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
}
