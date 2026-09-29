// Единственное место, где слаги enum EventCategory из openapi.yaml
// превращаются в русские подписи и палитры обложек.
// Палитра в формате EventCover — { base, a, b, c }: карточка без image_url
// получает градиент, закреплённый за своей категорией.

export const CATEGORIES = [
  { slug: 'music',        label: 'Музыка',       cover: { base: '#1B0B33', a: '#A855F7', b: '#E879F9', c: '#FB923C' } },
  { slug: 'party',        label: 'Вечеринки',    cover: { base: '#2A0A1F', a: '#F472B6', b: '#C084FC', c: '#FBBF24' } },
  { slug: 'exhibition',   label: 'Выставки',     cover: { base: '#1A1033', a: '#C084FC', b: '#F9A8D4', c: '#67E8F9' } },
  { slug: 'theatre',      label: 'Театр',        cover: { base: '#2A0710', a: '#F43F5E', b: '#FB7185', c: '#FBBF24' } },
  { slug: 'cinema',       label: 'Кино',         cover: { base: '#0A0F1F', a: '#6366F1', b: '#22D3EE', c: '#F472B6' } },
  { slug: 'sport',        label: 'Спорт',        cover: { base: '#2B1206', a: '#FB923C', b: '#F472B6', c: '#A855F7' } },
  { slug: 'outdoor',      label: 'На воздухе',   cover: { base: '#06231A', a: '#34D399', b: '#A3E635', c: '#38BDF8' } },
  { slug: 'food',         label: 'Еда',          cover: { base: '#2B1A05', a: '#FBBF24', b: '#FB923C', c: '#F43F5E' } },
  { slug: 'education',    label: 'Образование',  cover: { base: '#0B1630', a: '#38BDF8', b: '#818CF8', c: '#E879F9' } },
  { slug: 'volunteering', label: 'Волонтёрство', cover: { base: '#0A2226', a: '#2DD4BF', b: '#FDE047', c: '#F472B6' } },
  { slug: 'other',        label: 'Другое',       cover: { base: '#16122A', a: '#8B5CF6', b: '#94A3B8', c: '#E879F9' } },
];

const BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
const BY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.label, c]));
const FALLBACK = BY_SLUG.other;

/** Подписи в порядке CATEGORIES — готовые options для ChipGroup. */
export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

export function isCategory(slug) {
  return slug in BY_SLUG;
}

/** Слаг → подпись. Неизвестный слаг показываем как есть, а не «Другое». */
export function categoryLabel(slug) {
  return BY_SLUG[slug]?.label ?? slug ?? FALLBACK.label;
}

export function categoryCover(slug) {
  return (BY_SLUG[slug] ?? FALLBACK).cover;
}

/** Подпись чипса → слаг. Для неизвестной подписи вернёт undefined. */
export function categorySlug(label) {
  return BY_LABEL[label]?.slug;
}
