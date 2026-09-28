import s from './Loader.module.css';

/** Спиннер с подписью, занимает свободное место экрана. */
export default function Loader({ label = 'Загружаем…' }) {
  return (
    <div role="status" className={s.loader}>
      <div className={s.spinner} aria-hidden="true" />
      {label}
    </div>
  );
}
