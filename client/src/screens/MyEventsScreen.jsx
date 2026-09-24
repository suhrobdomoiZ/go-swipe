import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Screen from '../components/Screen';
import { IconCalendarBig, IconEdit, IconPlus, IconTrash } from '../components/icons';
import { BackHeader, EmptyState } from '../components/ui';
import s from './MyEventsScreen.module.css';
import { MY_EVENTS } from '../mocks/events';

const STATUS_CLASS = {
  'На модерации': s.statusPending,
  'Опубликовано': s.statusLive,
  'Завершено': s.statusDone,
};

export default function MyEventsScreen() {
  const [items, setItems] = useState(MY_EVENTS);

  const drop = (id) => setItems(items.filter((x) => x.id !== id));

  return (
    <Screen preset="swipe">
      <BackHeader to="/profile" title="Мои мероприятия" />

      <div className={s.list}>
        {items.length === 0 ? (
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
                  <EventCover cover={it.cover} radius={18} blur={10} />
                </div>
                <div className={s.col}>
                  <span className={s.itemTitle}>{it.title}</span>
                  <span className={s.itemWhen}>{it.when}</span>
                  <span className={`${s.status} ${STATUS_CLASS[it.status]}`}>
                    {it.status}
                  </span>
                </div>
              </div>

              <div className={s.actions}>
                <Link to={`/create?edit=${it.id}`} className={s.edit}>
                  <IconEdit size={15} aria-hidden="true" />
                  Редактировать
                </Link>
                <button
                  type="button"
                  aria-label={`Удалить «${it.title}»`}
                  onClick={() => drop(it.id)}
                  className={s.delete}
                >
                  <IconTrash size={17} />
                </button>
              </div>
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
