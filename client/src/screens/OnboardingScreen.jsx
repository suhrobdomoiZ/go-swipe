import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import FormError from '../components/FormError';
import Loader from '../components/Loader';
import Screen from '../components/Screen';
import { Select, ChipGroup } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './OnboardingScreen.module.css';
import { ApiError, getProfile, submitOnboarding, updateProfile } from '../api';
import { CATEGORY_LABELS } from '../api/categories';
import { CITIES } from '../lib/cities';
import { useSession } from '../lib/session';

function saveErrorText(err) {
  if (err instanceof ApiError && err.status === 0) return 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.';
  return 'Не получилось сохранить. Попробуй ещё раз.';
}

/**
 * Анкета. Два режима:
 * — первый вход (needOnboarding): POST /auth/onboarding, затем лента;
 * — уже прошёл онбординг (пришёл по «Изменить»): PATCH /profile.
 *   В PATCH /profile нет даты рождения, поэтому поля возраста в этом режиме нет.
 */
function OnboardingForm({ edit, initial }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateSession } = useSession();
  const [age, setAge] = useState(initial.age ?? '');
  const [city, setCity] = useState(initial.city || CITIES[0]);
  const [rubrics, setRubrics] = useState(initial.rubrics ?? []);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Город из профиля может не входить в наш список — не теряем его.
  const cities = CITIES.includes(city) ? CITIES : [city, ...CITIES];

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      if (edit) {
        const profile = await updateProfile({ city, rubrics });
        updateSession({ user: { ...user, city: profile.city } });
        if (location.state?.from) navigate(-1);
        else navigate('/profile', { replace: true });
      } else {
        // Ленту открываем только после ответа: первая выдача должна учесть интересы.
        const nextUser = await submitOnboarding({ age, city, rubrics });
        updateSession({ user: nextUser, needOnboarding: false });
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(saveErrorText(err));
      setSending(false);
    }
  };

  return (
    <Screen preset="form" className={s.content}>
      {user?.name && (
        <div className={s.user}>
          <div className={s.avatar}>{user.initial}</div>
          <div className={s.userCol}>
            <span className={s.userName}>{user.name}</span>
            <span className={s.userSource}>данные из MAX</span>
          </div>
        </div>
      )}

      <h1 className={s.title}>
        Расскажи<br />о себе
      </h1>
      <p className={s.lead}>
        Подберём мероприятия рядом и по твоим интересам
      </p>

      <div className={`${shared.glass} ${shared.panel}`}>
        {!edit && (
          <div className={shared.formRow}>
            <label className={shared.label} htmlFor="age">Возраст</label>
            <input
              id="age"
              className={shared.field}
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        )}

        <Select id="city" label="Город" options={cities} value={city} onChange={(e) => setCity(e.target.value)} />

        <div className={s.chipsRow}>
          <span className={shared.label}>Что тебе интересно</span>
          <ChipGroup options={CATEGORY_LABELS} value={rubrics} onChange={setRubrics} />
        </div>

        <FormError>{error}</FormError>
      </div>

      <button type="button" onClick={submit} disabled={sending} aria-busy={sending} className={s.submit}>
        {edit ? 'Сохранить' : 'Поехали'}
      </button>
    </Screen>
  );
}

export default function OnboardingScreen() {
  const { user, needOnboarding } = useSession();
  // Режим фиксируем при открытии: после отправки анкеты needOnboarding
  // сбрасывается раньше, чем завершится переход в ленту (навигация идёт transition'ом),
  // и экран не должен успеть переключиться в редактирование.
  const [firstRun] = useState(needOnboarding);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (firstRun) return undefined;
    const ctrl = new AbortController();
    getProfile({ signal: ctrl.signal })
      .then(setProfile)
      .catch((err) => {
        if (err.name !== 'AbortError') setLoadError(err);
      });
    return () => ctrl.abort();
  }, [firstRun, attempt]);

  if (firstRun) {
    return <OnboardingForm initial={{ age: user?.age ?? '', city: user?.city }} />;
  }

  if (loadError) {
    const retry = () => {
      setLoadError(null);
      setAttempt((n) => n + 1);
    };
    return (
      <Screen preset="form" className={s.content}>
        <ErrorState title="Не удалось загрузить профиль" text="Проверь интернет и попробуй ещё раз." onAction={retry} />
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen preset="form">
        <Loader />
      </Screen>
    );
  }

  return <OnboardingForm edit initial={{ city: profile.city, rubrics: profile.rubrics }} />;
}
