import { useState } from 'react';
import {
  BarChart3, UserPlus, LogIn, Trash2, Eye, EyeOff, IndianRupee,
  Users, KeyRound, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { formatINRFull } from '../utils/format';
import { cn } from '../utils/cn';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const {
    users, login, register, removeUser, getHint, showToast,
    maxUsers, userCount, darkMode, toggleDarkMode,
  } = useTrading();

  const [mode, setMode] = useState<Mode>(users.length === 0 ? 'register' : 'login');
  const [username, setUsername] = useState(users[0]?.username || '');
  const [password, setPassword] = useState('');
  const [hint, setHint] = useState('');
  const [capital, setCapital] = useState('1000000');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [hintText, setHintText] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
      showToast(result.message, 'error');
    } else {
      showToast(`Welcome back, ${username}!`, 'success');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cap = Number(capital);
    const result = register(username, password, hint, cap);
    if (!result.success) {
      setError(result.message);
      showToast(result.message, 'error');
    } else {
      showToast(`Account created for ${username}!`, 'success');
    }
  };

  const handleShowHint = () => {
    if (!username.trim()) {
      setError('Enter username first');
      return;
    }
    const h = getHint(username);
    if (h) {
      setHintText(h);
    } else {
      setHintText(null);
      setError('No hint found for this username');
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const result = removeUser(deleteTarget.id);
    if (result.success) {
      showToast(
        result.filename
          ? `User deleted. Report saved as ${result.filename}`
          : result.message,
        'success',
      );
      if (username === deleteTarget.username) {
        setUsername('');
        setPassword('');
      }
    } else {
      showToast(result.message, 'error');
    }
    setDeleteTarget(null);
  };

  const quickCapitals = [
    { label: '₹50K', value: 50000 },
    { label: '₹1L', value: 100000 },
    { label: '₹5L', value: 500000 },
    { label: '₹10L', value: 1000000 },
    { label: '₹25L', value: 2500000 },
    { label: '₹1Cr', value: 10000000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Brand panel */}
        <div className="lg:col-span-2 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-8 text-white shadow-2xl shadow-brand-500/20 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">NSE Paper Trading</h1>
            <p className="text-brand-100 text-sm leading-relaxed">
              Multi-user demo trading with real NSE market data. Create up to {maxUsers} accounts,
              set custom capital, and track separate portfolios.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-brand-100">
              <Users className="w-4 h-4" />
              <span>{userCount} / {maxUsers} users created</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-100">
              <IndianRupee className="w-4 h-4" />
              <span>Capital range: ₹10,000 – ₹10 Crore</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-brand-100">
              <KeyRound className="w-4 h-4" />
              <span>Password protected · Data saved locally</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="mt-4 text-xs text-brand-200 hover:text-white underline"
            >
              Switch to {darkMode ? 'Light' : 'Dark'} mode
            </button>
          </div>
        </div>

        {/* Auth form */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-800/90 rounded-3xl border border-surface-200 dark:border-surface-700 shadow-xl p-6 sm:p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-surface-100 dark:bg-surface-900/50 rounded-xl p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setHintText(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                mode === 'login'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              )}
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setHintText(null); }}
              disabled={userCount >= maxUsers}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all',
                mode === 'register'
                  ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300',
                userCount >= maxUsers && 'opacity-40 cursor-not-allowed'
              )}
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {hintText && (
            <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-3 text-sm">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Password hint: <strong className="ml-1">{hintText}</strong>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
                Username
              </label>
              {mode === 'login' && users.length > 0 ? (
                <select
                  value={username}
                  onChange={e => { setUsername(e.target.value); setHintText(null); setError(''); }}
                  className="w-full px-4 py-2.5 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Select user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.username} — Capital: {formatINRFull(u.initialCapital)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. Rahul_Trades"
                  className="w-full px-4 py-2.5 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min 6 chars, letter + number' : 'Enter password'}
                  className="w-full px-4 py-2.5 pr-11 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleShowHint}
                  className="mt-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  Forgot password? Show hint
                </button>
              )}
            </div>

            {mode === 'register' && (
              <>
                {/* Password hint */}
                <div>
                  <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
                    Password Hint
                  </label>
                  <input
                    type="text"
                    value={hint}
                    onChange={e => setHint(e.target.value)}
                    placeholder="e.g. My first pet's name"
                    className="w-full px-4 py-2.5 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                {/* Initial capital */}
                <div>
                  <label className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 block">
                    Starting Capital (₹)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    max={100000000}
                    step={1000}
                    value={capital}
                    onChange={e => setCapital(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {quickCapitals.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCapital(String(c.value))}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all',
                          Number(capital) === c.value
                            ? 'bg-brand-500 text-white'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-brand-100 dark:hover:bg-brand-500/20'
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-surface-400 mt-1.5">
                    Min ₹10,000 · Max ₹10 Crore · Selected: {formatINRFull(Number(capital) || 0)}
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              {mode === 'login' ? (
                <><LogIn className="w-4 h-4" /> Login to Trade</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Create & Start Trading</>
              )}
            </button>
          </form>

          {/* Existing users list with delete */}
          {users.length > 0 && (
            <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                Saved Accounts ({users.length}/{maxUsers})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900/40 border border-surface-100 dark:border-surface-700/50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{u.username}</p>
                      <p className="text-[11px] text-surface-400">
                        Capital: {formatINRFull(u.initialCapital)} · Last login: {new Date(u.lastLoginAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setMode('login');
                          setUsername(u.username);
                          setPassword('');
                          setError('');
                          setHintText(null);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: u.id, username: u.username })}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-surface-900 dark:text-white">Delete Account?</h3>
                <p className="text-xs text-surface-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-surface-600 dark:text-surface-300 mb-2">
              Are you sure you want to delete <strong>"{deleteTarget.username}"</strong>?
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-5">
              All portfolio data, orders, and watchlist will be permanently lost.
              An Excel report will be downloaded automatically before deletion.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white"
              >
                Delete & Export Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
