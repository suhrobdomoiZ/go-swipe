import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { IconCalendarBig, IconEdit, IconPlus } from '../components/icons';
import { BackHeader, EmptyState } from '../components/ui';
import s from './MyEventsScreen.module.css';
import { ApiError, getMyEvents } from '../api';

// Максимум ручки; больше своих мероприятий у пользователя пока не бывает.
const LIMIT = 50;

/**
 * Мероприятия, созданные пользователем. Статус только «Завершено» (из starts_at):
 * модерации нет. Редактировать можно ещё не начавшееся событие (PATCH /events/{id}); удаления в API нет.
 */
export default function MyEventsScreen() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    getMyEvents({ limit: LIMIT }, { signal: ctrl.signal })
      .then((res) => setItems(res.items))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        // GET /events/mine на бэке может ещё не быть — 404 показываем как пустой список.
        if (err instanceof ApiError && err.status === 404) setItems([]);
        else setError(err);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <Screen preset="swipe">
      <BackHeader to="/profile" title="Мои мероприятия" />

      <div className={s.list}>
        {error ? (
          <ErrorState title="Не удалось загрузить мероприятия" text="Проверь интернет и попробуй ещё раз." onAction={retry} />
        ) : !items ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconCalendarBig size={76} className={s.emptyIcon} />}
            title="Ты ещё ничего не создал"
            text="Собираешь джем, лекцию или забег? Добавь — и люди рядом увидят это в ленте."
            action={<Link to="/create" className={s.emptyAction}>Создать мероприятие</Link>}
          />
        ) : (
          items.map((it) => (
            <div key={it.id} className={s.item}>
              <div className={s.row}>
                <div className={s.cover}>
                  <EventCover cover={it.cover} image={it.image} radius={18} blur={10} />
                </div>
                <div className={s.col}>
                  <span className={s.itemTitle}>{it.title}</span>
                  <span className={s.itemWhen}>{it.when}</span>
                  {it.status && <span className={`${s.status} ${s.statusDone}`}>{it.status}</span>}
                </div>
              </div>
              {it.editable && (
                <div className={s.actions}>
                  <Link to={`/event/${it.id}/edit`} className={s.edit}>
                    <IconEdit size={15} aria-hidden="true" />
                    Редактировать
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Link to="/create" className={s.create}>
        <IconPlus size={18} aria-hidden="true" />
        Новое мероприятие
      </Link>
    </Screen>
  );
}
