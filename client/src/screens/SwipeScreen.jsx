import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Screen from '../components/Screen';
import { IconCalendar, IconClose, IconFilter, IconHeartFilled, IconPin, IconSadFace, IconSearch } from '../components/icons';
import shared from '../styles/shared.module.css';
import s from './SwipeScreen.module.css';
import { EVENTS } from '../mocks/events';

export default function SwipeScreen() {
  const [i, setI] = useState(0);
  const [liked, setLiked] = useState([]);
  const ev = EVENTS[i];

  const skip = () => setI(i + 1);
  const like = () => {
    setLiked([...liked, EVENTS[i].id]);
    setI(i + 1);
  };

  return (
    <Screen preset="swipe" nav>
      <header className={s.header}>
        <span className={s.brand}>Next2Me</span>
        <button type="button" aria-label="Фильтры" className={s.iconBtn}>
          <IconFilter size={20} />
        </button>
      </header>

      <div className={s.searchWrap}>
        <label htmlFor="q" className={shared.srOnly}>Поиск мероприятий</label>
        <div className={s.search}>
          <IconSearch size={18} className={s.searchIcon} />
          <input
            id="q"
            type="search"
            placeholder="Концерты, маркеты, лекции"
            className={s.searchInput}
          />
        </div>
      </div>

      {ev ? (
        <>
          <div className={s.deck}>
            <div className={s.stack}>
              <div className={s.behind2} />
              <div className={s.behind1} />

              <Link to={`/event/${ev.id}`} className={s.card}>
                <div className={s.cover}>
                  <EventCover cover={ev.cover} />
                  <span className={s.rubric}>{ev.rubric}</span>
                </div>

                <div className={s.body}>
                  <h2 className={s.title}>{ev.title}</h2>

                  <div className={s.meta}>
                    <IconCalendar size={17} />
                    <span className={s.metaText}>{ev.when}</span>
                  </div>

                  <div className={s.meta}>
                    <IconPin size={17} />
                    <span className={s.metaText}>{ev.place}</span>
                  </div>

                  <div className={s.badges}>
                    <span className={shared.badge}>{ev.price}</span>
                    <span className={shared.badge}>{ev.age}</span>
                  </div>
                </div>
              </Link>
            </div>

            <span className={s.counter}>{i + 1} из {EVENTS.length}</span>
          </div>

          <div className={s.actions}>
            <button type="button" aria-label="Пропустить" onClick={skip} className={s.skip}>
              <IconClose size={24} className={s.skipIcon} />
            </button>
            <button type="button" aria-label="В избранное" onClick={like} className={s.like}>
              <IconHeartFilled size={31} />
            </button>
          </div>
        </>
      ) : (
        <div className={s.empty}>
          <IconSadFace size={84} className={s.emptyIcon} />
          <h2 className={s.emptyTitle}>В твоём городе пока пусто</h2>
          <p className={s.emptyText}>
            Мы показали всё, что нашли по твоим фильтрам. Расширь запрос или загляни завтра.
          </p>
          <button type="button" onClick={() => setI(0)} className={s.emptyBtn}>
            Изменить фильтры
          </button>
        </div>
      )}
    </Screen>
  );
}
