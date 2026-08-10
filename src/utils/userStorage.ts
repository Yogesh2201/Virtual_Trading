import type { UserAccount, UserPublic, Position, Order, WatchlistItem } from '../types';

const STORAGE_KEY = 'nse_paper_users_v1';
const SESSION_KEY = 'nse_paper_session_v1';
const MAX_USERS = 10;

// Simple non-cryptographic hash for client-side password storage
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}_${password.length}`;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 2) return 'Username must be at least 2 characters';
  if (trimmed.length > 24) return 'Username must be under 24 characters';
  if (!/^[a-zA-Z0-9 _.-]+$/.test(trimmed)) return 'Username can only contain letters, numbers, spaces, . _ -';
  return null;
}

export function validateCapital(amount: number): string | null {
  if (!Number.isFinite(amount)) return 'Enter a valid capital amount';
  if (amount < 10000) return 'Minimum capital is ₹10,000';
  if (amount > 100000000) return 'Maximum capital is ₹10 Crore';
  return null;
}

function readUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: UserAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getMaxUsers(): number {
  return MAX_USERS;
}

export function getAllUsersPublic(): UserPublic[] {
  return readUsers().map(u => ({
    id: u.id,
    username: u.username,
    passwordHint: u.passwordHint,
    initialCapital: u.initialCapital,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));
}

export function getUserCount(): number {
  return readUsers().length;
}

export function createUser(
  username: string,
  password: string,
  passwordHint: string,
  initialCapital: number,
): { success: boolean; message: string; user?: UserAccount } {
  const users = readUsers();
  if (users.length >= MAX_USERS) {
    return { success: false, message: `Maximum ${MAX_USERS} users allowed. Delete a user to create a new one.` };
  }

  const nameErr = validateUsername(username);
  if (nameErr) return { success: false, message: nameErr };

  const passErr = validatePassword(password);
  if (passErr) return { success: false, message: passErr };

  if (!passwordHint.trim()) {
    return { success: false, message: 'Password hint is required' };
  }

  const capErr = validateCapital(initialCapital);
  if (capErr) return { success: false, message: capErr };

  const exists = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (exists) return { success: false, message: 'Username already exists' };

  const now = Date.now();
  const user: UserAccount = {
    id: `USR-${now}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    username: username.trim(),
    password: hashPassword(password),
    passwordHint: passwordHint.trim(),
    initialCapital,
    balance: initialCapital,
    positions: [],
    orders: [],
    watchlist: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
      { symbol: 'INFY', name: 'Infosys Ltd.' },
      { symbol: 'SBIN', name: 'State Bank of India' },
    ],
    createdAt: now,
    lastLoginAt: now,
  };

  users.push(user);
  writeUsers(users);
  return { success: true, message: 'Account created successfully', user };
}

export function authenticateUser(
  username: string,
  password: string,
): { success: boolean; message: string; user?: UserAccount } {
  const users = readUsers();
  const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) return { success: false, message: 'User not found' };
  if (user.password !== hashPassword(password)) {
    return { success: false, message: 'Incorrect password', user: undefined };
  }
  user.lastLoginAt = Date.now();
  writeUsers(users.map(u => (u.id === user.id ? user : u)));
  return { success: true, message: 'Login successful', user };
}

export function getPasswordHint(username: string): string | null {
  const user = readUsers().find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  return user?.passwordHint || null;
}

export function deleteUser(userId: string): boolean {
  const users = readUsers().filter(u => u.id !== userId);
  writeUsers(users);
  const session = getSession();
  if (session?.userId === userId) clearSession();
  return true;
}

export function saveUserPortfolio(
  userId: string,
  data: {
    balance: number;
    positions: Position[];
    orders: Order[];
    watchlist: WatchlistItem[];
  },
) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx] = {
    ...users[idx],
    balance: data.balance,
    positions: data.positions,
    orders: data.orders,
    watchlist: data.watchlist,
  };
  writeUsers(users);
}

export function getUserById(userId: string): UserAccount | null {
  return readUsers().find(u => u.id === userId) || null;
}

export function setSession(userId: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: Date.now() }));
}

export function getSession(): { userId: string; at: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
