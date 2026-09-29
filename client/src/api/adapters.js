// Преобразование ответов API в форму, которую ждут компоненты, и обратно.
// Компоненты про формат бэка ничего не знают — всё сопоставление полей здесь.

import { categoryCover, categoryLabel, categorySlug, isCategory } from './categories';

// Вес категории, которую пользователь сам отметил в редактировании интересов,
// если у неё ещё нет положительного веса. Равен одному лайку (delta like=+1).
const PICKED_INTEREST_WEIGHT = 1;

// EventInput требует ends_at, а в форме создания есть только начало.
// Пока в форме нет поля окончания, считаем событие двухчасовым.
// ends_at — не данные пользователя, поэтому в карточки он не попадает.
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

// Время события показывается и вводится в поясе события, а не устройства:
// 19:00 по Москве — это 19:00 у любого пользователя. Пока все события московские.
const EVENT_TIME_ZONE = 'Europe/Moscow';

const tz = { timeZone: EVENT_TIME_ZONE };
const DAY = new Intl.DateTimeFormat('ru-RU', { ...tz, day: 'numeric', month: 'long' });
const DAY_YEAR = new Intl.DateTimeFormat('ru-RU', { ...tz, day: 'numeric', month: 'long', year: 'numeric' });
const YEAR = new Intl.DateTimeFormat('ru-RU', { ...tz, year: 'numeric' });
const TIME = new Intl.DateTimeFormat('ru-RU', { ...tz, hour: '2-digit', minute: '2-digit' });
const PARTS = new Intl.DateTimeFormat('en-US', {
  ...tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
});
const MONEY = new Intl.NumberFormat('ru-RU');

/* --- форматирование --- */

function parseDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** «27 сентября, 22:00»; год добавляется, только если он не текущий. */
export function formatWhen(startsAt) {
  const d = parseDate(startsAt);
  if (!d) return '';
  const day = YEAR.format(d) === YEAR.format(new Date()) ? DAY : DAY_YEAR;
  return `${day.format(d)}, ${TIME.format(d)}`;
}

/** Значение datetime-local («2026-10-02T19:00») как время в поясе события → Date. */
export function fromEventLocalTime(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value ?? '');
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  // Смещение пояса: те же «часы на стене» в поясе события минус UTC.
  const p = Object.fromEntries(PARTS.formatToParts(wall).map((x) => [x.type, Number(x.value)]));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - wall;
  return new Date(wall - offset);
}

export function formatPrice(price) {
  return price > 0 ? `${MONEY.format(price)} ₽` : 'Бесплатно';
}

export function formatAge(ageLimit) {
  return `${ageLimit ?? 0}+`;
}

function yearsWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'год';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
  return 'лет';
}

export function isFinished(startsAt) {
  const d = parseDate(startsAt);
  return d ? d.getTime() < Date.now() : false;
}

/* --- возраст ↔ birth_date --- */

const pad = (n) => String(n).padStart(2, '0');

/** Возраст из онбординга → birth_date (YYYY-MM-DD): сегодняшняя дата N лет назад. */
export function ageToBirthDate(age) {
  const n = Number(age);
  if (!Number.isInteger(n) || n <= 0 || n > 120) return null;
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function birthDateToAge(birthDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate ?? '');
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  const now = new Date();
  const hadBirthday = now.getMonth() + 1 > mo || (now.getMonth() + 1 === mo && now.getDate() >= d);
  return now.getFullYear() - y - (hadBirthday ? 0 : 1);
}

/* --- API → компоненты --- */

// url и image_url приходят и от пользователей — пропускаем только http(s)
// и путь к файлу, загруженному через POST /uploads (бэк отдаёт его относительным: /uploads/<uuid>.png).
function safeUrl(value) {
  const v = value ?? '';
  return /^https?:\/\//i.test(v) || /^\/uploads\/[\w.-]+$/.test(v) ? v : null;
}

/** Event → карточка для ленты, деталей и избранного. */
export function toEventCard(ev) {
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description,
    when: formatWhen(ev.starts_at),
    place: ev.venue || ev.city || '',
    price: formatPrice(ev.price),
    age: formatAge(ev.age_limit),
    rubric: categoryLabel(ev.category),
    cover: categoryCover(ev.category),
    image: safeUrl(ev.image_url),
    ticketUrl: safeUrl(ev.url),
  };
}

/** Event → строка «Моих мероприятий». Модерации нет, статус только «Завершено». */
export function toMyEvent(ev) {
  return {
    ...toEventCard(ev),
    status: isFinished(ev.starts_at) ? 'Завершено' : null,
  };
}

/** FavoriteItem → карточка избранного с флагом «точно иду». */
export function toFavorite(item) {
  return {
    ...toEventCard(item.event),
    confirmed: Boolean(item.confirmed),
  };
}

export function toUser(user) {
  if (!user) return null;
  const name = user.name?.trim() ?? '';
  return {
    id: user.id,
    name,
    initial: name.charAt(0).toUpperCase(),
    city: user.city ?? '',
    age: birthDateToAge(user.birth_date),
  };
}

/**
 * Profile → профиль: «Москва · 21 год», интересы с положительным весом по убыванию
 * и rubrics — те из них, что являются категориями (для чипсов редактирования).
 */
export function toProfile(profile) {
  const user = toUser(profile.user) ?? { name: '', initial: '', city: '', age: null };
  const meta = [user.city, user.age != null && `${user.age} ${yearsWord(user.age)}`]
    .filter(Boolean)
    .join(' · ');
  const positive = (profile.interests ?? [])
    .filter((it) => it.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return {
    ...user,
    meta,
    interests: positive.map((it) => (isCategory(it.tag) ? categoryLabel(it.tag) : it.tag)),
    rubrics: positive.filter((it) => isCategory(it.tag)).map((it) => categoryLabel(it.tag)),
  };
}

/* --- формы → API --- */

function toSlugs(labels = []) {
  return labels.map(categorySlug).filter(Boolean);
}

/** Форма онбординга { age, city, rubrics } → тело POST /auth/onboarding. */
export function toOnboardingInput({ age, city, rubrics }) {
  const body = { city, categories: toSlugs(rubrics) };
  const birthDate = ageToBirthDate(age);
  if (birthDate) body.birth_date = birthDate;
  return body;
}

/**
 * Форма редактирования { city, rubrics } → тело PATCH /profile.
 * interests — полная замена набора, поэтому собираем его из текущего (GET /profile):
 * теги и отрицательные веса не трогаем, снятые категории убираем,
 * отмеченные без положительного веса получают PICKED_INTEREST_WEIGHT.
 * Возраста (birth_date) в PATCH /profile нет — он здесь не отправляется.
 */
export function toProfilePatch({ city, rubrics }, currentInterests = []) {
  const picked = new Set(toSlugs(rubrics));
  const interests = currentInterests.filter(
    (it) => !isCategory(it.tag) || picked.has(it.tag) || it.weight <= 0,
  ).map((it) => (
    picked.has(it.tag) && it.weight <= 0 ? { tag: it.tag, weight: PICKED_INTEREST_WEIGHT } : it
  ));

  for (const tag of picked) {
    if (!interests.some((it) => it.tag === tag)) interests.push({ tag, weight: PICKED_INTEREST_WEIGHT });
  }

  return { city, interests };
}

/**
 * Форма создания → EventInput.
 * Категория в API одна: первый выбранный чипс — category, остальные — tags.
 * startsAt/endsAt — значения datetime-local, читаются во времени события (EVENT_TIME_ZONE).
 */
export function toEventInput(form) {
  const [category = 'other', ...tags] = toSlugs(form.rubrics);
  const startsAt = fromEventLocalTime(form.startsAt);
  if (!startsAt) throw new Error('Укажи дату и время начала');
  const endsAt = fromEventLocalTime(form.endsAt) ?? new Date(startsAt.getTime() + DEFAULT_DURATION_MS);

  const input = {
    title: form.title.trim(),
    description: (form.description ?? '').trim(),
    category,
    city: form.city,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    price: form.paid ? Math.max(0, parseInt(form.price, 10) || 0) : 0,
    age_limit: parseInt(form.age, 10) || 0,
  };

  // Необязательные поля отправляем только непустыми.
  if (tags.length) input.tags = tags;
  const venue = form.venue?.trim();
  if (venue) input.venue = venue;
  const url = form.url?.trim();
  if (url) input.url = url;
  const imageUrl = form.imageUrl?.trim();
  if (imageUrl) input.image_url = imageUrl;

  return input;
}
