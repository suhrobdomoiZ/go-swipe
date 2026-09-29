import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
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

// Жест: протянул дальше SWIPE_DISTANCE — свайп; короткий быстрый бросок тоже считается.
const SWIPE_DISTANCE = 100;   // px
const FLICK_DISTANCE = 40;    // px
const FLICK_SPEED = 0.5;      // px/мс
const GESTURE_SLOP = 8;       // px — до этого не решаем, горизонтальный жест или вертикальный
const SNAP_MS = 180;
const FLY_MS = 260;

const cardTransform = (dx) => `translateX(${dx}px) rotate(${dx / 18}deg)`;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function CardContent({ ev }) {
  return (
    <>
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
    </>
  );
}

// Карточку тянут пальцем или мышью; тап без движения — как обычная ссылка на детали.
const dragSurface = { touchAction: 'pan-y', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };

/**
 * Верхняя карточка колоды со свайпом: вправо — лайк, влево — пропуск.
 * onDrag(dx) — смещение во время жеста (для подсказки на кнопках),
 * onRelease(action, dx) — жест засчитан.
 */
function SwipeCard({ ev, onDrag, onRelease }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const dragged = useRef(false);

  const place = (dx, animate) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${SNAP_MS}ms ease-out` : 'none';
    el.style.transform = dx ? cardTransform(dx) : '';
    onDrag(dx);
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, dx: 0, horizontal: null };
    dragged.current = false;
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (d.horizontal === null) {
      if (Math.abs(dx) < GESTURE_SLOP && Math.abs(dy) < GESTURE_SLOP) return;
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      // Вертикальный жест — не наш, отдаём прокрутке.
      if (!d.horizontal) {
        drag.current = null;
        return;
      }
      dragged.current = true;
      try {
        ref.current.setPointerCapture(e.pointerId);
      } catch {
        // указатель уже отпущен — дотянем без захвата
      }
    }
    d.dx = dx;
    place(dx, false);
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.horizontal) return;
    const speed = Math.abs(d.dx) / Math.max(1, e.timeStamp - d.t0);
    const swiped = Math.abs(d.dx) >= SWIPE_DISTANCE || (Math.abs(d.dx) >= FLICK_DISTANCE && speed >= FLICK_SPEED);
    if (swiped) {
      onDrag(0);
      onRelease(d.dx > 0 ? 'like' : 'skip', d.dx);
    } else {
      place(0, true);
    }
  };

  const onPointerCancel = () => {
    drag.current = null;
    place(0, true);
  };

  // После протяжки отпускание не должно открывать детали.
  const onClickCapture = (e) => {
    if (!dragged.current) return;
    e.preventDefault();
    e.stopPropagation();
    dragged.current = false;
  };

  return (
    <Link
      ref={ref}
      to={`/event/${ev.id}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
      style={dragSurface}
      className={s.card}
    >
      <CardContent ev={ev} />
    </Link>
  );
}

/** Улетающая копия карточки: следующая уже видна под ней, это только анимация. */
function FlyingCard({ ev, dir, fromDx, onDone }) {
  const ref = useRef(null);
  const done = useEffectEvent(onDone);

  useLayoutEffect(() => {
    const anim = ref.current.animate(
      [
        { transform: cardTransform(fromDx) },
        { transform: `translateX(${dir * (window.innerWidth + 160)}px) rotate(${dir * 28}deg)` },
      ],
      { duration: FLY_MS, easing: 'ease-in', fill: 'forwards' },
    );
    anim.onfinish = () => done();
    return () => anim.cancel();
  }, [dir, fromDx]);

  return (
    <div ref={ref} aria-hidden="true" className={s.card} style={{ pointerEvents: 'none' }}>
      <CardContent ev={ev} />
    </div>
  );
}

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

  const swipedIds = useRef(new Set());   // каждую карточку свайпаем один раз: жест и кнопка не задвоят
  const [flying, setFlying] = useState([]);
  const likeBtn = useRef(null);
  const skipBtn = useRef(null);

  // Оптимистично: следующая карточка сразу, свайп уходит в фоне,
  // а свайпнутая улетает поверх неё анимацией.
  const swipe = (card, action, fromDx = 0) => {
    if (!card || swipedIds.current.has(card.id)) return;
    swipedIds.current.add(card.id);
    if (!reducedMotion()) setFlying((f) => [...f, { ev: card, dir: action === 'like' ? 1 : -1, fromDx }]);
    setI((n) => n + 1);
    pending.current += 1;
    swipeEvent(card.id, action)
      // 409 — сервер этот свайп уже учёл. Остальные ошибки пользователю не показываем:
      // 401 перехватывает AuthGate, а неучтённое событие просто останется в выдаче.
      .then(() => true, (err) => err instanceof ApiError && err.status === 409)
      .then((counted) => {
        pending.current -= 1;
        if (counted) confirmed.current += 1;
      });
  };

  // Пока карточку тянут, кнопка того же действия подрастает — подсказка, что сейчас случится.
  const hint = (dx) => {
    const p = Math.max(-1, Math.min(1, dx / SWIPE_DISTANCE));
    if (likeBtn.current) likeBtn.current.style.transform = p > 0 ? `scale(${1 + 0.18 * p})` : '';
    if (skipBtn.current) skipBtn.current.style.transform = p < 0 ? `scale(${1 - 0.18 * p})` : '';
  };

  const landed = (id) => setFlying((f) => f.filter((x) => x.ev.id !== id));

  if (ev) {
    return (
      <>
        <div className={s.deck}>
          <div className={s.stack}>
            <div className={s.behind2} />
            <div className={s.behind1} />

            <SwipeCard key={ev.id} ev={ev} onDrag={hint} onRelease={(action, dx) => swipe(ev, action, dx)} />

            {flying.map((f) => (
              <FlyingCard key={f.ev.id} ev={f.ev} dir={f.dir} fromDx={f.fromDx} onDone={() => landed(f.ev.id)} />
            ))}
          </div>

          <span className={s.counter}>{i + 1} из {Math.max(total, deck.length)}</span>
        </div>

        <div className={s.actions}>
          <button ref={skipBtn} type="button" aria-label="Пропустить" onClick={() => swipe(ev, 'skip')} className={s.skip}>
            <IconClose size={24} className={s.skipIcon} />
          </button>
          <button ref={likeBtn} type="button" aria-label="В избранное" onClick={() => swipe(ev, 'like')} className={s.like}>
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
