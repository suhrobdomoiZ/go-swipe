import { EmptyState } from './ui';
import { IconSadFace } from './icons';
import s from './ErrorState.module.css';

/** Ошибка загрузки в виде пустого состояния: заголовок, текст и кнопка повтора. */
export default function ErrorState({ title, text, hint, actionLabel = 'Попробовать ещё раз', onAction }) {
  return (
    <div role="alert" className={s.alert}>
      <EmptyState
        icon={<IconSadFace size={84} className={s.icon} />}
        title={title}
        text={text}
        action={
          <>
            {hint && <p className={s.hint}>{hint}</p>}
            {onAction && <button type="button" onClick={onAction} className={s.retry}>{actionLabel}</button>}
          </>
        }
      />
    </div>
  );
}
