import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { IconBack, IconCalendar, IconPin } from '../components/icons';
import shared from '../styles/shared.module.css';
import s from './DetailsScreen.module.css';
import { ApiError, getEvent } from '../api';
import { openExternalLink } from '../lib/max';

export default function DetailsScreen() {
  const { id } = useParams();
  // Результат привязан к id: при смене id старая карточка не показывается, пока грузится новая.
  const [result, setResult] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getEvent(id, { signal: ctrl.signal })
      .then((ev) => setResult({ id, ev }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ id, error });
      });
    return () => ctrl.abort();
  }, [id]);

  if (result?.id !== id) {
    return (
      <Screen preset="form">
        <Loader />
      </Screen>
    );
  }

  if (result.error) {
    const notFound = result.error instanceof ApiError && result.error.status === 404;
    return (
      <Screen className={s.notFound}>
        <p className={s.notFoundText}>
          {notFound ? 'Мероприятие не найдено.' : 'Не удалось загрузить мероприятие. Проверь интернет и попробуй ещё раз.'}
        </p>
        <Link to="/">Вернуться к ленте</Link>
      </Screen>
    );
  }

  const { ev } = result;

  // Внутри MAX внешняя ссылка открывается через мост, в браузере — обычной новой вкладкой.
  const openTicket = (e) => {
    if (openExternalLink(ev.ticketUrl)) e.preventDefault();
  };

  return (
    <Screen preset="form">
      <div className={s.hero}>
        <EventCover cover={ev.cover} image={ev.image} radius={0} blur={36} />
        <Link to="/" aria-label="Назад" className={s.back}>
          <IconBack size={21} />
        </Link>
      </div>

      <div className={s.card}>
        <div className={s.badges}>
          <span className={shared.badge}>{ev.rubric}</span>
          <span className={shared.badge}>{ev.age}</span>
        </div>

        <h1 className={s.title}>{ev.title}</h1>

        <div className={s.meta}>
          <IconCalendar size={18} />
          <span className={s.metaText}>{ev.when}</span>
        </div>

        <div className={s.metaTop}>
          <IconPin size={18} className={s.pinIcon} />
          <div className={s.placeCol}>
            <span className={s.metaText}>{ev.place}</span>
            <a href="#map" className={s.routeLink}>Как добраться</a>
          </div>
        </div>

        {ev.description && <p className={s.description}>{ev.description}</p>}

        <div className={s.footer}>
          <div className={s.priceCol}>
            <span className={s.priceLabel}>Билет от</span>
            <span className={s.price}>{ev.price}</span>
          </div>
          {ev.ticketUrl && (
            <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" onClick={openTicket} className={s.buy}>
              Купить билет
            </a>
          )}
        </div>
      </div>
    </Screen>
  );
}
