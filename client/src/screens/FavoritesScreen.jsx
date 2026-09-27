import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Screen from '../components/Screen';
import { IconClose, IconHeartBig } from '../components/icons';
import { EmptyState } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './FavoritesScreen.module.css';
import { EVENTS } from '../mocks/events';

function plural(n) {
  if (n === 1) return 'событие';
  if (n > 1 && n < 5) return 'события';
  return 'событий';
}

export default function FavoritesScreen() {
  // Пока нет общего стора — берём первые три как «лайкнутые».
  const [items, setItems] = useState(EVENTS.slice(0, 3));

  const drop = (id) => setItems(items.filter((x) => x.id !== id));

  return (
    <Screen preset="swipe" nav>
      <div className={s.head}>
        <h1 className={s.title}>Избранное</h1>
        <span className={s.count}>{items.length} {plural(items.length)}</span>
      </div>

      <div className={s.list}>
        {items.length === 0 ? (
          <EmptyState
            icon={<IconHeartBig size={76} className={s.emptyIcon} />}
            title="Тут пока пусто"
            text="Свайпай вправо всё, что зацепило — оно окажется здесь."
          />
        ) : (
          items.map((it) => (
            <div key={it.id} className={shared.listCard}>
              <div className={s.cover}>
                <EventCover cover={it.cover} radius={18} blur={11} />
              </div>

              <Link to={`/event/${it.id}`} className={s.link}>
                <span className={s.itemTitle}>{it.title}</span>
                <span className={s.itemMeta}>{it.when}</span>
                <span className={s.itemMeta}>{it.place}</span>
              </Link>

              <button
                type="button"
                aria-label={`Убрать «${it.title}» из избранного`}
                onClick={() => drop(it.id)}
                className={s.remove}
              >
                <IconClose size={19} strokeWidth={1.9} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className={s.spacer} />
    </Screen>
  );
}
