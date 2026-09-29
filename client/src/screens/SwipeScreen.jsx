import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { IconCalendar, IconClose, IconHeartFilled, IconPin, IconSadFace, IconSearch } from '../components/icons';
import shared from '../styles/shared.module.css';
import s from './SwipeScreen.module.css';
import { ApiError, getEvents, swipeEvent } from '../api';

const PAGE_SIZE = 20;
// Следующую страницу просим, когда в колоде остаётся столько карточек.
const PREFETCH_AT = 3;
const SEARCH_DEBOUNCE_MS = 300;

/** Колода по одному поисковому запросу q (пустой — вся лента). */
function Deck({ q }) {
  const [deck, setDeck] = useState([]);
  const [i, setI] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Номер карточки, на которой упала подгрузка: повторяем после следующего свайпа или по кнопке.
  const [failedAt, setFailedAt] = useState(null);

  const inFlight = useRef(false);   // «запрос в пути»: одна страница — один запрос
  const seen = useRef(new Set());   // id всех карточек, попавших в колоду, — против дублей
  const confirmed = useRef(0);      // свайпы, которые сервер уже учёл (200 или 409)
  const pending = useRef(0);        // свайпы, отправленные, но ещё без ответа

  const loadMore = useCallback(async (at) => {
    if (inFlight.current) return;
    inFlight.current = true;
    // Бэк убирает свайпнутые события из выдачи, поэтому offset — не длина колоды,
    // а число загруженных карточек, которые сервер ещё считает непросмотренными.
    // Свайпы в пути вычитаем тоже: сервер может учесть их раньше, чем этот GET,
    // и тогда страница съедет вперёд с пропуском событий. Если не успеет —
    // событие придёт повторно и отсеется по seen: лучше дубль, чем пропуск.
    const offset = seen.current.size - confirmed.current - pending.current;
    try {
      const page = await getEvents({ q, limit: PAGE_SIZE, offset });
      const fresh = page.items.filter((ev) => !seen.current.has(ev.id));
      fresh.forEach((ev) => seen.current.add(ev.id));
      setDeck((d) => [...d, ...fresh]);
      setTotal(confirmed.current + page.total);
      // Страница без новых карточек — дальше просить нечего, иначе зациклимся.
      setHasMore(fresh.length > 0 && offset + page.items.length < page.total);
      setFailedAt(null);
    } catch {
      setFailedAt(at);
    } finally {
      inFlight.current = false;
    }
  }, [q]);

  useEffect(() => {
    if (!hasMore || deck.length - i > PREFETCH_AT || failedAt === i) return;
    loadMore(i);
  }, [deck.length, i, hasMore, failedAt, loadMore]);

  const ev = deck[i];

  // Оптимистично: следующая карточка сразу, свайп уходит в фоне.
  const swipe = (action) => {
    if (!ev) return;
    setI(i + 1);
    pending.current += 1;
    swipeEvent(ev.id, action)
      // 409 — сервер этот свайп уже учёл. Остальные ошибки пользователю не показываем:
      // 401 перехватывает AuthGate, а неучтённое событие просто останется в выдаче.
      .then(() => true, (err) => err instanceof ApiError && err.status === 409)
      .then((counted) => {
        pending.current -= 1;
        if (counted) confirmed.current += 1;
      });
  };

  if (ev) {
    return (
      <>
        <div className={s.deck}>
          <div className={s.stack}>
            <div className={s.behind2} />
            <div className={s.behind1} />

            <Link to={`/event/${ev.id}`} className={s.card}>
              <div className={s.cover}>
                <EventCover cover={ev.cover} image={ev.image} />
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

          <span className={s.counter}>{i + 1} из {Math.max(total, deck.length)}</span>
        </div>

        <div className={s.actions}>
          <button type="button" aria-label="Пропустить" onClick={() => swipe('skip')} className={s.skip}>
            <IconClose size={24} className={s.skipIcon} />
          </button>
          <button type="button" aria-label="В избранное" onClick={() => swipe('like')} className={s.like}>
            <IconHeartFilled size={31} />
          </button>
        </div>
      </>
    );
  }

  if (failedAt !== null) {
    return (
      <div role="alert" className={s.empty}>
        <IconSadFace size={84} className={s.emptyIcon} />
        <h2 className={s.emptyTitle}>Не удалось загрузить ленту</h2>
        <p className={s.emptyText}>Проверь интернет и попробуй ещё раз.</p>
        <button type="button" onClick={() => setFailedAt(null)} className={s.emptyBtn}>
          Обновить
        </button>
      </div>
    );
  }

  if (hasMore) return <Loader label={q ? 'Ищем…' : 'Подбираем мероприятия…'} />;

  return (
    <div className={s.empty}>
      <IconSadFace size={84} className={s.emptyIcon} />
      {q ? (
        <>
          <h2 className={s.emptyTitle}>Ничего не нашли</h2>
          <p className={s.emptyText}>По запросу «{q}» мероприятий нет. Попробуй другое слово.</p>
        </>
      ) : (
        <>
          <h2 className={s.emptyTitle}>В твоём городе пока пусто</h2>
          <p className={s.emptyText}>
            Мы показали всё, что нашли по твоим фильтрам. Расширь запрос или загляни завтра.
          </p>
        </>
      )}
    </div>
  );
}

export default function SwipeScreen() {
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');

  // Поиск по названию: q уходит в GET /events через SEARCH_DEBOUNCE_MS после последнего ввода.
  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // «Найти» на клавиатуре — искать сразу и спрятать клавиатуру.
  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    setQ(query.trim());
    e.currentTarget.blur();
  };

  return (
    <Screen preset="swipe" nav>
      <header className={s.header}>
        <span className={s.brand}>Next2Me</span>
      </header>

      <div className={s.searchWrap}>
        <label htmlFor="q" className={shared.srOnly}>Поиск мероприятий</label>
        <div className={s.search}>
          <IconSearch size={18} className={s.searchIcon} />
          <input
            id="q"
            type="search"
            enterKeyHint="search"
            placeholder="Концерты, маркеты, лекции"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className={s.searchInput}
          />
        </div>
      </div>

      {/* Новый запрос — новая колода: key сбрасывает карточки, seen и счётчики свайпов. */}
      <Deck key={q} q={q} />
    </Screen>
  );
}
