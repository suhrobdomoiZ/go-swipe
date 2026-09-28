// Мост к MAX: initData приходит из window.WebApp (скрипт max-web-app.js).
// В обычном браузере при `npm run dev` берём VITE_DEV_INIT_DATA, чтобы можно было отлаживаться.
// В продакшен-сборку отладочное значение не попадает.

export function getInitData() {
  const fromMax = window.WebApp?.initData;
  if (fromMax) return fromMax;
  if (import.meta.env.DEV) return import.meta.env.VITE_DEV_INIT_DATA || null;
  return null;
}

/**
 * Внешняя ссылка внутри MAX открывается через мост, а не переходом в вебвью.
 * Возвращает true, если ссылку открыл мост; иначе вызывающий оставляет обычный переход.
 */
export function openExternalLink(url) {
  const inMax = Boolean(window.WebApp?.initData);
  if (!inMax || typeof window.WebApp.openLink !== 'function') return false;
  window.WebApp.openLink(url);
  return true;
}
