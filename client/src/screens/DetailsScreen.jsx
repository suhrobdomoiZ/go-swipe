import { Link, useParams } from 'react-router-dom';
import EventCover from '../components/EventCover';
import Screen from '../components/Screen';
import { IconBack, IconCalendar, IconPin } from '../components/icons';
import shared from '../styles/shared.module.css';
import s from './DetailsScreen.module.css';
import { EVENTS } from '../mocks/events';

export default function DetailsScreen() {
  const { id } = useParams();
  const ev = EVENTS.find((e) => String(e.id) === id);

  if (!ev) {
    return (
      <Screen className={s.notFound}>
        <p className={s.notFoundText}>Мероприятие не найдено.</p>
        <Link to="/">Вернуться к ленте</Link>
      </Screen>
    );
  }

  return (
    <Screen preset="form">
      <div className={s.hero}>
        <EventCover cover={ev.cover} radius={0} blur={36} />
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

        <p className={s.description}>
          {ev.description ?? '[ОПИСАНИЕ МЕРОПРИЯТИЯ — приходит с бэкенда]'}
        </p>

        <div className={s.footer}>
          <div className={s.priceCol}>
            <span className={s.priceLabel}>Билет от</span>
            <span className={s.price}>{ev.price}</span>
          </div>
          <a href={ev.ticketUrl ?? '#'} className={s.buy}>
            Купить билет
          </a>
        </div>
      </div>
    </Screen>
  );
}
