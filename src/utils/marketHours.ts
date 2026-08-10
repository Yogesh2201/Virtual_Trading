// NSE market hours: 9:15 AM – 3:30 PM IST, Monday–Friday

function getISTDate(date = new Date()): Date {
  // Convert to IST using toLocaleString (works without external deps)
  const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istString);
}

export function isMarketOpen(date = new Date()): boolean {
  const ist = getISTDate(date);
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = 9 * 60 + 15;  // 9:15
  const closeMinutes = 15 * 60 + 30; // 15:30

  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

export function getMarketStatus(date = new Date()): {
  isOpen: boolean;
  label: string;
  nextOpenLabel: string;
} {
  const ist = getISTDate(date);
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      label: 'Market Closed (Weekend)',
      nextOpenLabel: 'Opens Monday 9:15 AM IST',
    };
  }

  if (totalMinutes < openMinutes) {
    return {
      isOpen: false,
      label: 'Pre-Market',
      nextOpenLabel: 'Opens today 9:15 AM IST',
    };
  }

  if (totalMinutes >= closeMinutes) {
    return {
      isOpen: false,
      label: 'Market Closed',
      nextOpenLabel: day === 5 ? 'Opens Monday 9:15 AM IST' : 'Opens tomorrow 9:15 AM IST',
    };
  }

  return {
    isOpen: true,
    label: 'Market Open',
    nextOpenLabel: 'Closes 3:30 PM IST',
  };
}

export function formatISTTime(date = new Date()): string {
  return getISTDate(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
