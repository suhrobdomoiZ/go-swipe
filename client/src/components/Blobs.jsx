import s from './Blobs.module.css';

const PRESETS = {
  swipe: [
    { color: '#8B2FE0', size: 360, blur: 46, anim: 'drift-a 24s', pos: { left: -110, top: -80 } },
    { color: '#C026D3', size: 340, blur: 52, anim: 'drift-b 29s', pos: { right: -130, top: 210 } },
    { color: '#4C1D95', size: 380, blur: 58, anim: 'drift-c 34s', pos: { left: -70, bottom: -120 } },
  ],
  form: [
    { color: '#C026D3', size: 380, blur: 50, anim: 'drift-a 26s', pos: { right: -120, top: -90 } },
    { color: '#7C3AED', size: 360, blur: 54, anim: 'drift-b 31s', pos: { left: -140, top: 300 } },
    { color: '#F97316', size: 340, blur: 62, anim: 'drift-c 36s', pos: { right: -100, bottom: -130 }, opacity: 0.75 },
  ],
};

function rgba0(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
}

export default function Blobs({ preset = 'swipe' }) {
  return (
    <>
      {PRESETS[preset].map((b, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={s.blob}
          style={{
            ...b.pos,
            width: b.size,
            height: b.size,
            opacity: b.opacity ?? 1,
            background: `radial-gradient(circle at 44% 42%, ${b.color}, ${rgba0(b.color)} 70%)`,
            filter: `blur(${b.blur}px)`,
            animation: `${b.anim} ease-in-out infinite`,
          }}
        />
      ))}
    </>
  );
}
