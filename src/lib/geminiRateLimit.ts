const DAILY_LIMIT  = 10;
const MINUTE_LIMIT = 1; // gemini-2.5-flash free tier: 5 RPM; 4 gives safe headroom
const STORAGE_KEY  = 'gemini_usage';

interface GeminiUsage {
  date:       string;
  dailyCount: number;
  minuteLog:  number[]; // timestamps (ms) of requests in the last 60s
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): GeminiUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw) as GeminiUsage;
    return data.date === todayISO() ? data : fresh();
  } catch {
    return fresh();
  }
}

function fresh(): GeminiUsage {
  return { date: todayISO(), dailyCount: 0, minuteLog: [] };
}

function save(u: GeminiUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

function recentLog(minuteLog: number[]): number[] {
  const cutoff = Date.now() - 60_000;
  return minuteLog.filter((t) => t > cutoff);
}

export interface RateLimitStatus {
  allowed:        boolean;
  reason?:        string;
  waitSeconds?:   number;
  dailyUsed:      number;
  dailyRemaining: number;
}

export function checkRateLimit(): RateLimitStatus {
  const u      = load();
  const recent = recentLog(u.minuteLog);

  if (u.dailyCount >= DAILY_LIMIT) {
    return {
      allowed:        false,
      reason:         `Daily limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`,
      dailyUsed:      u.dailyCount,
      dailyRemaining: 0,
    };
  }

  if (recent.length >= MINUTE_LIMIT) {
    const oldest     = Math.min(...recent);
    const waitMs     = oldest + 60_000 - Date.now();
    const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
    return {
      allowed:        false,
      reason:         `Too many requests — please wait ${waitSeconds}s and try again.`,
      waitSeconds,
      dailyUsed:      u.dailyCount,
      dailyRemaining: DAILY_LIMIT - u.dailyCount,
    };
  }

  return { allowed: true, dailyUsed: u.dailyCount, dailyRemaining: DAILY_LIMIT - u.dailyCount };
}

export function recordRequest(): void {
  const u      = load();
  const recent = recentLog(u.minuteLog);
  save({ date: todayISO(), dailyCount: u.dailyCount + 1, minuteLog: [...recent, Date.now()] });
}

export function getUsage(): { dailyUsed: number; dailyRemaining: number } {
  const u = load();
  return { dailyUsed: u.dailyCount, dailyRemaining: DAILY_LIMIT - u.dailyCount };
}
