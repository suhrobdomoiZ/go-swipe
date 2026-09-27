import { useId } from 'react';
import s from './EventCover.module.css';

/**
 * Переливающаяся обложка события.
 * Когда бэк отдаст картинки — этот компонент меняется на <img>,
 * а cover-палитра остаётся запасным вариантом, если картинки нет.
 */
export default function EventCover({ cover, radius = 22, blur = 30 }) {
  const id = useId();
  const { base, a, b, c } = cover;

  return (
    <svg
      viewBox="0 0 322 262"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={s.cover}
      style={{ borderRadius: radius }}
    >
      <defs>
        {[a, b, c].map((color, i) => (
          <radialGradient key={i} id={`${id}-${i}`}>
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
        <filter id={`${id}-f`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>

      <rect width="322" height="262" fill={base} />
      <g filter={`url(#${id}-f)`}>
        <ellipse cx="96" cy="86" rx="130" ry="112" fill={`url(#${id}-0)`} />
        <ellipse cx="248" cy="182" rx="126" ry="106" fill={`url(#${id}-1)`} />
        <ellipse cx="180" cy="42" rx="86" ry="70" fill={`url(#${id}-2)`} />
      </g>
      <path
        d="M-10 214 C 80 176, 150 236, 250 190 C 292 170, 320 178, 332 172 L 332 272 L -10 272 Z"
        className={s.scrim}
        opacity="0.3"
      />
    </svg>
  );
}
