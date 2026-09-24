/**
 * Общий набор иконок.
 * Каждая принимает size и любые пропсы svg — цвет наследуется
 * от currentColor, если не передан stroke/fill.
 * Толщина, скругления и flex-shrink заданы под конкретную иконку,
 * чтобы отрисовка совпадала с исходной вёрсткой.
 */

function Icon({ size = 24, viewBox = '0 0 24 24', style, children, ...rest }) {
  return (
    <svg viewBox={viewBox} style={{ width: size, height: size, ...style }} {...rest}>
      {children}
    </svg>
  );
}

/** Базовые атрибуты контурной иконки. */
const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
};

/** Иконка в строке текста не должна сжиматься. */
const fixed = { flexShrink: 0 };

/* --- мелкие иконки, viewBox 24 --- */

export function IconCalendar({ size = 17, style, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.7} style={{ ...fixed, ...style }} {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Icon>
  );
}

export function IconCalendarPlus({ size = 20, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17M12 13v5M9.5 15.5h5" />
    </Icon>
  );
}

export function IconPin({ size = 17, style, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.7} style={{ ...fixed, ...style }} {...p}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </Icon>
  );
}

export function IconClose({ size = 24, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={2.2} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function IconBack({ size = 20, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={2} strokeLinejoin="round" {...p}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  );
}

export function IconSearch({ size = 18, style, ...p }) {
  return (
    <Icon size={size} {...line} style={{ ...fixed, ...style }} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}

export function IconFilter({ size = 20, ...p }) {
  return (
    <Icon size={size} {...line} {...p}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </Icon>
  );
}

export function IconPlus({ size = 18, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={2.2} {...p}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconChevronDown({ size = 18, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.9} strokeLinejoin="round" {...p}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

export function IconChevronRight({ size = 17, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.9} strokeLinejoin="round" {...p}>
      <path d="M9.5 5l7 7-7 7" />
    </Icon>
  );
}

export function IconEdit({ size = 15, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </Icon>
  );
}

export function IconTrash({ size = 17, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13" />
    </Icon>
  );
}

export function IconGear({ size = 20, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.7} {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </Icon>
  );
}

export function IconUser({ size = 23, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.8 20c1.2-3.6 4-5.4 7.2-5.4s6 1.8 7.2 5.4" />
    </Icon>
  );
}

export function IconCards({ size = 23, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <rect x="7" y="4" width="12" height="16" rx="3" />
      <path d="M4.5 7.5v9" />
    </Icon>
  );
}

export function IconHeart({ size = 23, ...p }) {
  return (
    <Icon size={size} {...line} strokeLinejoin="round" {...p}>
      <path d="M12 20l-1.4-1.3C5.9 14.4 3.2 11.9 3.2 8.8 3.2 6.3 5.1 4.4 7.5 4.4c1.4 0 2.7.6 3.6 1.7l.9 1 .9-1c.9-1.1 2.2-1.7 3.6-1.7 2.4 0 4.3 1.9 4.3 4.4 0 3.1-2.7 5.6-7.4 9.9z" />
    </Icon>
  );
}

export function IconHeartFilled({ size = 31, ...p }) {
  return (
    <Icon size={size} fill="currentColor" {...p}>
      <path d="M12 20.5l-1.5-1.4C5.4 14.5 2.5 11.9 2.5 8.6 2.5 6 4.5 4 7.1 4c1.5 0 2.9.7 3.9 1.8L12 6.9l1-1.1C14 4.7 15.4 4 16.9 4 19.5 4 21.5 6 21.5 8.6c0 3.3-2.9 5.9-8 10.5z" />
    </Icon>
  );
}

export function IconImage({ size = 28, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.7} strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="15" rx="3" />
      <path d="M3 16l5-4 4 3 4-4 5 4" />
      <circle cx="9" cy="10" r="1.4" />
    </Icon>
  );
}

export function IconInfo({ size = 17, style, ...p }) {
  return (
    <Icon size={size} {...line} strokeWidth={1.7} style={{ ...fixed, ...style }} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v0.1" />
    </Icon>
  );
}

/* --- крупные иллюстрации пустых состояний, viewBox 96 --- */

export function IconHeartBig({ size = 76, ...p }) {
  return (
    <Icon size={size} viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" {...p}>
      <path d="M48 78l-5.6-5.2C24.8 56.8 14 46.8 14 34.4 14 24.4 21.6 16.8 31.2 16.8c5.6 0 10.8 2.4 14.4 6.8l2.4 2.8 2.4-2.8c3.6-4.4 8.8-6.8 14.4-6.8C74 16.8 82 24.4 82 34.4c0 12.4-10.8 22.4-28.4 38.4z" />
    </Icon>
  );
}

export function IconCalendarBig({ size = 76, ...p }) {
  return (
    <Icon size={size} viewBox="0 0 96 96" {...line} strokeWidth={3} strokeLinejoin="round" {...p}>
      <rect x="14" y="22" width="68" height="60" rx="10" />
      <path d="M30 14v14M66 14v14M14 40h68M48 54v16M40 62h16" />
    </Icon>
  );
}

export function IconSadFace({ size = 84, ...p }) {
  return (
    <Icon size={size} viewBox="0 0 96 96" {...line} strokeWidth={3} {...p}>
      <circle cx="48" cy="48" r="38" />
      <path d="M34 40l10 6M62 40l-10 6M34 64c8-7 20-7 28 0" />
    </Icon>
  );
}
