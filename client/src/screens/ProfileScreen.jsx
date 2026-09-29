import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { IconCalendarPlus, IconChevronRight, IconGear } from '../components/icons';
import s from './ProfileScreen.module.css';
import { getMyEvents, getProfile } from '../api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [myCount, setMyCount] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getProfile({ signal: ctrl.signal })
      .then(setProfile)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => ctrl.abort();
  }, [attempt]);

  // Счётчик «Моих мероприятий» — из total. Ручки на бэке может ещё не быть (404) —
  // тогда просто без числа.
  useEffect(() => {
    const ctrl = new AbortController();
    getMyEvents({ limit: 1 }, { signal: ctrl.signal })
      .then((res) => setMyCount(res.total))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <Screen preset="form" nav>
      <div className={s.head}>
        <h1 className={s.title}>Профиль</h1>
        <button type="button" aria-label="Настройки" className={s.settings}>
          <IconGear size={20} />
        </button>
      </div>

      {error ? (
        <div className={s.sectionGrow}>
          <ErrorState title="Не удалось загрузить профиль" text="Проверь интернет и попробуй ещё раз." onAction={retry} />
        </div>
      ) : !profile ? (
        <Loader />
      ) : (
        <>
          <div className={s.card}>
            <div className={s.avatar}>{profile.initial}</div>
            <div className={s.userCol}>
              <span className={s.userName}>{profile.name}</span>
              {profile.meta && <span className={s.userMeta}>{profile.meta}</span>}
            </div>
          </div>

          <div className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>Интересы</h2>
              <Link to="/onboarding" state={{ from: '/profile' }} className={s.editLink}>Изменить</Link>
            </div>
            <div className={s.interests}>
              {profile.interests.map((t) => (
                <span key={t} className={s.interestChip}>{t}</span>
              ))}
            </div>
          </div>

          <Link to="/my" className={s.myEvents}>
            <span className={s.myEventsIcon}>
              <IconCalendarPlus size={20} aria-hidden="true" />
            </span>
            <span className={s.myEventsLabel}>Мои мероприятия</span>
            {myCount != null && <span className={s.myEventsCount}>{myCount}</span>}
            <IconChevronRight size={17} className={s.chevron} aria-hidden="true" />
          </Link>

          {/* На месте скрытой «Истории мероприятий»: держит нижнюю навигацию внизу экрана. */}
          <div className={s.sectionGrow} aria-hidden="true" />
        </>
      )}

      <div className={s.spacer} />
    </Screen>
  );
}
