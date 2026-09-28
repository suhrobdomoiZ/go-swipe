import s from './FormError.module.css';

/** Текст ошибки под формой или списком. Без текста ничего не рендерит. */
export default function FormError({ children }) {
  if (!children) return null;
  return <p role="alert" className={s.error}>{children}</p>;
}
