// По функции на каждую ручку из openapi.yaml.
// Наружу отдаются уже адаптированные объекты — экраны не видят формат бэка.

import { request, setToken } from './client';
import {
  toEventCard,
  toEventInput,
  toFavorite,
  toMyEvent,
  toOnboardingInput,
  toProfile,
  toProfilePatch,
  toUser,
} from './adapters';

export { ApiError, getToken, onUnauthorized, setToken } from './client';

const eventPath = (id) => `/events/${encodeURIComponent(id)}`;
const favoritePath = (id) => `/favorites/${encodeURIComponent(id)}`;

/* --- auth --- */

/** POST /auth/max — вход по initData, сохраняет токен. Старый токен сбрасывается до запроса. */
export async function authMax(initData, { signal } = {}) {
  setToken(null);
  const data = await request('/auth/max', {
    method: 'POST',
    body: { init_data: initData },
    signal,
    notifyUnauthorized: false,
  });
  setToken(data.token);
  return { needOnboarding: Boolean(data.need_onboarding), user: toUser(data.user) };
}

/** POST /auth/onboarding — форма { age, city, rubrics }. */
export async function submitOnboarding(form, { signal } = {}) {
  const user = await request('/auth/onboarding', { method: 'POST', body: toOnboardingInput(form), signal });
  return toUser(user);
}

/* --- events --- */

/** GET /events — лента. params: q, category, is_free, price_max, age_limit, date_from, date_to, limit, offset. */
export async function getEvents(params = {}, { signal } = {}) {
  const data = await request('/events', { query: params, signal });
  return { items: (data?.items ?? []).map(toEventCard), total: data?.total ?? 0 };
}

/** POST /events — форма создания мероприятия. */
export async function createEvent(form, { signal } = {}) {
  const ev = await request('/events', { method: 'POST', body: toEventInput(form), signal });
  return toEventCard(ev);
}

/** GET /events/mine — params: limit, offset. */
export async function getMyEvents(params = {}, { signal } = {}) {
  const data = await request('/events/mine', { query: params, signal });
  return { items: (data?.items ?? []).map(toMyEvent), total: data?.total ?? 0 };
}

/** GET /events/{eventId} */
export async function getEvent(id, { signal } = {}) {
  const ev = await request(eventPath(id), { signal });
  return toEventCard(ev);
}

/* --- swipes --- */

/** POST /events/{eventId}/swipe — action: 'like' | 'skip'. */
export function swipeEvent(id, action, { signal } = {}) {
  return request(`${eventPath(id)}/swipe`, { method: 'POST', body: { action }, signal });
}

/* --- favorites --- */

/** GET /favorites — confirmed: true «точно иду», false «пока не решил», undefined — все. */
export async function getFavorites({ confirmed } = {}, { signal } = {}) {
  const data = await request('/favorites', { query: { confirmed }, signal });
  return (data?.items ?? []).map(toFavorite);
}

/** PATCH /favorites/{eventId} — по спеке используется только для подтверждения участия. */
export async function confirmFavorite(id, confirmed = true, { signal } = {}) {
  const item = await request(favoritePath(id), { method: 'PATCH', body: { confirmed }, signal });
  return toFavorite(item);
}

/** DELETE /favorites/{eventId} */
export async function deleteFavorite(id, { signal } = {}) {
  await request(favoritePath(id), { method: 'DELETE', signal });
}

/* --- profile --- */

/** GET /profile */
export async function getProfile({ signal } = {}) {
  return toProfile(await request('/profile', { signal }));
}

/**
 * PATCH /profile — форма редактирования { city, rubrics }.
 * interests в PATCH — полная замена, поэтому сначала берём свежие веса из GET /profile.
 */
export async function updateProfile(form, { signal } = {}) {
  const current = await request('/profile', { signal });
  const body = toProfilePatch(form, current?.interests);
  return toProfile(await request('/profile', { method: 'PATCH', body, signal }));
}

/* --- uploads --- */

/** POST /uploads — png, jpeg или webp до 5 МБ. Возвращает публичный URL для image_url. */
export async function uploadImage(file, { signal } = {}) {
  const body = new FormData();
  body.append('file', file);
  const data = await request('/uploads', { method: 'POST', body, signal });
  return data.url;
}
