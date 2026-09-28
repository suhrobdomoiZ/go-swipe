// Обёртка над fetch: базовый URL, Bearer-токен, разбор ошибок по схеме Error.

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const TOKEN_KEY = 'goswipe.token';

// В вебвью MAX localStorage может быть недоступен (или бросать на доступе),
// поэтому токен всегда дублируется в памяти.
let memoryToken = null;

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setToken(token) {
  memoryToken = token ?? null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // остаёмся на токене в памяти
  }
}

// 401 посреди сессии — токен протух. Подписчик один: AuthGate, он предлагает войти снова.
let unauthorizedListener = null;

export function onUnauthorized(listener) {
  unauthorizedListener = listener;
  return () => {
    if (unauthorizedListener === listener) unauthorizedListener = null;
  };
}

/** Ошибка ответа API. code и message — из схемы Error, status — HTTP-код (0 — сети нет). */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// Тело ошибки может оказаться не JSON (например, 404 от прокси) — тогда null.
async function readJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Запрос к API.
 *
 * query  — объект query-параметров, пустые значения отбрасываются
 * body   — объект уходит как JSON, FormData — как multipart
 * signal — AbortSignal; отмена пробрасывается как есть (AbortError)
 * notifyUnauthorized — сообщать ли подписчику о 401 (для самого входа — нет)
 */
export async function request(path, { method = 'GET', query, body, signal, notifyUnauthorized = true } = {}) {
  if (!BASE_URL) {
    throw new ApiError(0, 'no_api_url', 'Не задан адрес API (VITE_API_URL)');
  }

  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(BASE_URL + path + buildQuery(query), { method, headers, body: payload, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Нет связи с сервером');
  }

  if (res.status === 204) return null;

  const data = await readJson(res);
  if (!res.ok) {
    const err = new ApiError(
      res.status,
      data?.code ?? `http_${res.status}`,
      data?.message ?? `Ошибка сервера (${res.status})`,
    );
    if (res.status === 401 && notifyUnauthorized) unauthorizedListener?.(err);
    throw err;
  }
  return data;
}
