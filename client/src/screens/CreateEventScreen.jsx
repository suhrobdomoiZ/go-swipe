import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoverPicker from '../components/CoverPicker';
import FormError from '../components/FormError';
import Screen from '../components/Screen';
import { IconInfo } from '../components/icons';
import { BackHeader, Select, ChipGroup } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './CreateEventScreen.module.css';
import { ApiError, createEvent } from '../api';
import { CATEGORY_LABELS } from '../api/categories';
import { CITIES } from '../lib/cities';
import { useSession } from '../lib/session';

const AGES = ['0+', '6+', '12+', '16+', '18+'];

function publishErrorText(err) {
  if (err instanceof ApiError && err.status === 400) return `Сервер не принял мероприятие: ${err.message}`;
  if (err instanceof ApiError && err.status === 0) return 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.';
  return 'Не получилось опубликовать. Попробуй ещё раз.';
}

export default function CreateEventScreen() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [paid, setPaid] = useState(false);
  const [rubrics, setRubrics] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const cities = user?.city && !CITIES.includes(user.city) ? [user.city, ...CITIES] : CITIES;

  const seg = (on) => (on ? `${s.seg} ${s.segOn}` : s.seg);

  const submit = async (e) => {
    e.preventDefault();
    // Категория в API обязательна — это первый выбранный чипс.
    if (rubrics.length === 0) {
      setError('Выбери хотя бы одну рубрику.');
      return;
    }

    const data = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    try {
      await createEvent({
        title: data.get('title'),
        description: data.get('description'),
        city: data.get('city'),
        venue: data.get('venue'),
        startsAt: data.get('startsAt'),
        paid,
        price: data.get('price'),
        age: data.get('age'),
        rubrics,
        imageUrl,
      });
      navigate('/my');
    } catch (err) {
      setError(publishErrorText(err));
      setSending(false);
    }
  };

  return (
    <Screen preset="form" as="form" onSubmit={submit} className={s.content}>
      <div className={s.headerBleed}>
        <BackHeader to="/" title="Новое мероприятие" />
      </div>

      <div className={`${shared.glass} ${shared.panel}`}>
        <CoverPicker className={s.coverBtn} value={imageUrl} onChange={setImageUrl} onBusyChange={setUploading} />

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-title">Название</label>
          <input id="ev-title" name="title" className={shared.field} type="text" maxLength={128} placeholder="Например, джем в гараже" required />
        </div>

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-desc">Описание</label>
          <textarea id="ev-desc" name="description" className={shared.field} rows={3} maxLength={2048} placeholder="Что будет, для кого, что взять с собой" required />
        </div>

        <Select id="ev-city" name="city" label="Город" options={cities} defaultValue={user?.city || CITIES[0]} />

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-place">Место</label>
          <input id="ev-place" name="venue" className={shared.field} type="text" maxLength={256} placeholder="Адрес или название площадки" />
        </div>

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-date">Дата и время</label>
          <input id="ev-date" name="startsAt" className={shared.field} type="datetime-local" required />
        </div>

        <div className={s.entryRow}>
          <span className={shared.label}>Вход</span>
          <div className={s.segmented}>
            <button type="button" aria-pressed={!paid} onClick={() => setPaid(false)} className={seg(!paid)}>Бесплатно</button>
            <button type="button" aria-pressed={paid} onClick={() => setPaid(true)} className={seg(paid)}>Платно</button>
          </div>
          {paid && (
            <div className={shared.formRow}>
              <label className={shared.label} htmlFor="ev-price">Цена билета, ₽</label>
              <input id="ev-price" name="price" className={shared.field} type="number" inputMode="numeric" min={1} placeholder="500" required />
            </div>
          )}
        </div>

        <Select id="ev-age" name="age" label="Возрастное ограничение" options={AGES} />

        <div className={s.chipsRow}>
          <span className={shared.label}>Рубрики</span>
          <ChipGroup options={CATEGORY_LABELS} value={rubrics} onChange={setRubrics} />
        </div>

        <FormError>{error}</FormError>
      </div>

      <div className={s.note}>
        <IconInfo size={17} aria-hidden="true" className={s.noteIcon} />
        <span className={s.noteText}>
          Мероприятие сразу появится в ленте
        </span>
      </div>

      <button type="submit" disabled={sending || uploading} aria-busy={sending} className={s.submit}>
        Опубликовать
      </button>
    </Screen>
  );
}
