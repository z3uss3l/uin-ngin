const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const configured = () => String(typeof process !== 'undefined' ? process.env.UIN_LOG_LEVEL || 'warn' : 'info').toLowerCase();

export function createLogger(scope = 'uin-core') {
  const threshold = LEVELS[configured()] ?? LEVELS.info;
  const emit = (level, message, context = {}) => {
    if (LEVELS[level] < threshold) return;
    const payload = { ts: new Date().toISOString(), level, scope, message, ...context };
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.info;
    fn(`[${scope}] ${message}`, payload);
  };
  return { debug: (m,c) => emit('debug',m,c), info:(m,c)=>emit('info',m,c), warn:(m,c)=>emit('warn',m,c), error:(m,c)=>emit('error',m,c) };
}

export const logger = createLogger();
