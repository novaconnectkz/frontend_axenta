/**
 * Условный logger для отладочных сообщений.
 *
 * В production (`import.meta.env.PROD`) debug/info/warn — no-op,
 * в dev — обычный console.* с emoji-префиксами.
 *
 * Принудительное включение в проде: localStorage.setItem("acrm_debug", "1").
 *
 * Errors (logger.error) выводятся всегда — они важны для саппорта/sentry.
 */

const FORCED = (() => {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("acrm_debug") === "1";
  } catch {
    return false;
  }
})();

const DEBUG_ENABLED = import.meta.env.DEV || FORCED;

export const logger = {
  debug(...args: unknown[]): void {
    if (DEBUG_ENABLED) console.log(...args);
  },
  info(...args: unknown[]): void {
    if (DEBUG_ENABLED) console.info(...args);
  },
  warn(...args: unknown[]): void {
    if (DEBUG_ENABLED) console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
