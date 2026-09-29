import Screen from './Screen';
import s from './Centered.module.css';

/** Экран с фоном и одним блоком по центру. */
export default function Centered({ children }) {
  return (
    <Screen preset="swipe" className={s.center}>
      <div>{children}</div>
    </Screen>
  );
}
