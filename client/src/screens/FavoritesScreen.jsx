import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import ErrorState from '../components/ErrorState';
import FormError from '../components/FormError';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { IconCheck, IconClose, IconHeartBig } from '../components/icons';
import { EmptyState } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './FavoritesScreen.module.css';
import { ApiError, confirmFavorite, deleteFavorite, getFavorites } from '../api';

function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'событие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'события';
  return 'событий';
}

const isNotFound = (err) => err instanceof ApiError && err.status === 404;

function FavoriteCard({ item, busy, onConfirm, onRemove }) {
  return (
    <div className={shared.listCard}>
      <div className={s.cover}>
        <EventCover cover={item.cover} image={item.image} radius={18} blur={11} />
      </div>

      <Link to={`/event/${item.id}`} className={s.link}>
        <span className={s.itemTitle}>{item.title}</span>
        <span className={s.itemMeta}>{item.when}</span>
        <span className={s.itemMeta}>{item.place}</span>
      </Link>

      {onConfirm && (
        <button
          type="button"
          aria-label={`Точно иду на «${item.title}»`}
          disabled={busy}
          onClick={onConfirm}
          className={s.remove}
        >
          <IconCheck size={20} />
        </button>
      )}
      <button
        type="button"
        aria-label={`Убрать «${item.title}» из избранного`}
        disabled={busy}
        onClick={onRemove}
        className={s.remove}
      >
        <IconClose size={19} strokeWidth={1.9} />
      </button>
    </div>
  );
}

/**
 * Избранное в две ступени: «пока не решил» (confirmed=false) и «точно иду» (confirmed=true).
 * Галочка — PATCH /favorites/{id}, крестик — DELETE /favorites/{id}.
 */
export default function FavoritesScreen() {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(() => new Set());
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getFavorites({}, { signal: ctrl.signal })
      .then(setItems)
      .catch((err) => {
        if (err.name !== 'AbortError') setLoadError(err);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const retry = () => {
    setLoadError(null);
    setAttempt((n) => n + 1);
  };

  // Кнопки карточки заблокированы, пока запрос по ней в пути; список меняем по ответу сервера.
  const run = async (id, request, errorText) => {
    setBusy((b) => new Set(b).add(id));
    setActionError(null);
    try {
      const updated = await request();
      setItems((list) => (updated
        ? list.map((x) => (x.id === id ? updated : x))
        : list.filter((x) => x.id !== id)));
    } catch {
      setActionError(errorText);
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  // 404 — карточки уже нет в избранном: просто убираем её из списка.
  const confirm = (id) => run(
    id,
    () => confirmFavorite(id).catch((err) => { if (isNotFound(err)) return null; throw err; }),
    'Не получилось отметить «Точно иду». Попробуй ещё раз.',
  );
  const remove = (id) => run(
    id,
    () => deleteFavorite(id).then(() => null, (err) => { if (isNotFound(err)) return null; throw err; }),
    'Не получилось убрать из избранного. Попробуй ещё раз.',
  );

  const undecided = items?.filter((x) => !x.confirmed) ?? [];
  const going = items?.filter((x) => x.confirmed) ?? [];

  const card = (it, canConfirm) => (
    <FavoriteCard
      key={it.id}
      item={it}
      busy={busy.has(it.id)}
      onConfirm={canConfirm ? () => confirm(it.id) : null}
      onRemove={() => remove(it.id)}
    />
  );

  return (
    <Screen preset="swipe" nav>
      <div className={s.head}>
        <h1 className={s.title}>Избранное</h1>
        {items && <span className={s.count}>{items.length} {plural(items.length)}</span>}
      </div>

      <div className={s.list}>
        {loadError ? (
          <ErrorState title="Не удалось загрузить избранное" text="Проверь интернет и попробуй ещё раз." onAction={retry} />
        ) : !items ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IconHeartBig size={76} className={s.emptyIcon} />}
            title="Тут пока пусто"
            text="Свайпай вправо всё, что зацепило — оно окажется здесь."
          />
        ) : (
          <>
            <FormError>{actionError}</FormError>

            {undecided.length > 0 && (
              <>
                <h2 className={s.itemTitle}>Пока не решил</h2>
                {undecided.map((it) => card(it, true))}
              </>
            )}

            {going.length > 0 && (
              <>
                <h2 className={s.itemTitle}>Точно иду</h2>
                {going.map((it) => card(it, false))}
              </>
            )}
          </>
        )}
      </div>

      <div className={s.spacer} />
    </Screen>
  );
}
