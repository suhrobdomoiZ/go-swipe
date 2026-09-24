import { Link } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconCalendarPlus, IconChevronRight, IconGear } from '../components/icons';
import s from './ProfileScreen.module.css';
import { MY_EVENTS, HISTORY } from '../mocks/events';

const INTERESTS = ['Музыка', 'Технологии', 'Маркеты', 'Спорт'];

export default function ProfileScreen() {
  return (
    <Screen preset="form" nav>
      <div className={s.head}>
        <h1 className={s.title}>Профиль</h1>
        <button type="button" aria-label="Настройки" className={s.settings}>
          <IconGear size={20} />
        </button>
      </div>

      <div className={s.card}>
        <div className={s.avatar}>А</div>
        <div className={s.userCol}>
          <span className={s.userName}>Алексей</span>
          <span className={s.userMeta}>Москва · 21 год</span>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>Интересы</h2>
          <Link to="/onboarding" className={s.editLink}>Изменить</Link>
        </div>
        <div className={s.interests}>
          {INTERESTS.map((t) => (
            <span key={t} className={s.interestChip}>{t}</span>
          ))}
        </div>
      </div>

      <Link to="/my" className={s.myEvents}>
        <span className={s.myEventsIcon}>
          <IconCalendarPlus size={20} aria-hidden="true" />
        </span>
        <span className={s.myEventsLabel}>Мои мероприятия</span>
        <span className={s.myEventsCount}>{MY_EVENTS.length}</span>
        <IconChevronRight size={17} className={s.chevron} aria-hidden="true" />
      </Link>

      <div className={s.sectionGrow}>
        <h2 className={s.sectionTitle}>История мероприятий</h2>
        <div className={s.history}>
          {HISTORY.map((h) => (
            <div key={h.title} className={s.historyItem}>
              <div className={s.historyTint} style={{ background: h.tint }} />
              <div className={s.historyCol}>
                <span className={s.historyTitle}>{h.title}</span>
                <span className={s.historyWhen}>{h.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.spacer} />
    </Screen>
  );
}
