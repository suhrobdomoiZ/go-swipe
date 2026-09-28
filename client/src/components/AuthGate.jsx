import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, authMax, onUnauthorized } from '../api';
import { getInitData, notifyReady } from '../lib/max';
import { SessionContext } from '../lib/session';
import ErrorState from './ErrorState';
import Loader from './Loader';
import Screen from './Screen';
import s from './AuthGate.module.css';

const SESSION_EXPIRED = 'session_expired';

function describeError(error) {
  if (error instanceof ApiError && error.code === SESSION_EXPIRED) {
    return { title: 'Сессия истекла', text: 'Войди снова, чтобы продолжить.', action: 'Войти снова' };
  }
  if (error instanceof ApiError && error.code === 'no_api_url') {
    return { title: 'Не настроен адрес API', text: 'Задай VITE_API_URL в .env.local и перезапусти сборку.' };
  }
  if (error instanceof ApiError && error.status === 401) {
    return { title: 'Не получилось войти', text: 'MAX не подтвердил данные входа. Закрой приложение и открой его заново.' };
  }
  if (error instanceof ApiError && error.status === 0) {
    return { title: 'Нет связи с сервером', text: 'Проверь интернет и попробуй ещё раз.', action: 'Попробовать ещё раз' };
  }
  return { title: 'Что-то пошло не так', text: 'Сервер ответил ошибкой. Попробуй ещё раз чуть позже.', action: 'Попробовать ещё раз' };
}

function Centered({ children }) {
  return (
    <Screen preset="swipe" className={s.center}>
      <div>{children}</div>
    </Screen>
  );
}

/**
 * Вход при старте: initData из MAX → POST /auth/max → токен.
 * Пока идёт вход — загрузка; новый пользователь уходит на /onboarding.
 * Дочерние маршруты рендерятся только с готовой сессией.
 * 401 на любом запросе посреди сессии — «Сессия истекла» и повторный вход.
 */
export default function AuthGate({ children }) {
  const navigate = useNavigate();
  const [initData] = useState(getInitData);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Первый кадр AuthGate (спиннер входа или сообщение) уже осмысленный — MAX может убирать заставку.
  useEffect(() => {
    notifyReady();
  }, []);

  const onAuthed = useEffectEvent((res) => {
    setSession(res);
    if (res.needOnboarding) navigate('/onboarding', { replace: true });
  });

  useEffect(() => {
    if (!initData) return undefined;
    const ctrl = new AbortController();
    authMax(initData, { signal: ctrl.signal })
      .then((res) => onAuthed(res))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => ctrl.abort();
  }, [initData, attempt]);

  useEffect(() => onUnauthorized(() => {
    setSession(null);
    setError(new ApiError(401, SESSION_EXPIRED, 'Сессия истекла'));
  }), []);

  const value = useMemo(
    () => session && {
      ...session,
      updateSession: (patch) => setSession((prev) => ({ ...prev, ...patch })),
    },
    [session],
  );

  if (!initData) {
    return (
      <Centered>
        <ErrorState
          title="Открой приложение в MAX"
          text="Не нашли данных для входа. Запусти мини-приложение из MAX — в обычном браузере оно не работает."
          hint={import.meta.env.DEV && 'Для отладки в браузере задай VITE_DEV_INIT_DATA в .env.local.'}
        />
      </Centered>
    );
  }

  if (error) {
    const { title, text, action } = describeError(error);
    const again = () => {
      setError(null);
      setAttempt((n) => n + 1);
    };
    return (
      <Centered>
        <ErrorState title={title} text={text} actionLabel={action} onAction={action && again} />
      </Centered>
    );
  }

  if (!value) {
    return (
      <Screen preset="swipe">
        <Loader label="Входим через MAX…" />
      </Screen>
    );
  }

  return <SessionContext value={value}>{children}</SessionContext>;
}
