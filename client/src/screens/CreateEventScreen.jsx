import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { IconImage, IconInfo } from '../components/icons';
import { BackHeader, Select, ChipGroup } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './CreateEventScreen.module.css';
import { RUBRICS, CITIES } from '../mocks/events';

const AGES = ['0+', '6+', '12+', '16+', '18+'];

export default function CreateEventScreen() {
  const navigate = useNavigate();
  const [paid, setPaid] = useState(false);
  const [rubrics, setRubrics] = useState(['Музыка']);

  const seg = (on) => (on ? `${s.seg} ${s.segOn}` : s.seg);

  const submit = (e) => {
    e.preventDefault();
    // TODO: POST /events
    navigate('/my');
  };

  return (
    <Screen preset="form" as="form" onSubmit={submit} className={s.content}>
      <div className={s.headerBleed}>
        <BackHeader to="/" title="Новое мероприятие" />
      </div>

      <div className={`${shared.glass} ${shared.panel}`}>
        <button type="button" className={s.coverBtn}>
          <IconImage size={28} />
          Добавить обложку
        </button>

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-title">Название</label>
          <input id="ev-title" className={shared.field} type="text" placeholder="Например, джем в гараже" required />
        </div>

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-desc">Описание</label>
          <textarea id="ev-desc" className={shared.field} rows={3} placeholder="Что будет, для кого, что взять с собой" />
        </div>

        <Select id="ev-city" label="Город" options={CITIES} />

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-place">Место</label>
          <input id="ev-place" className={shared.field} type="text" placeholder="Адрес или название площадки" />
        </div>

        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="ev-date">Дата и время</label>
          <input id="ev-date" className={shared.field} type="datetime-local" />
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
              <input id="ev-price" className={shared.field} type="number" placeholder="500" />
            </div>
          )}
        </div>

        <Select id="ev-age" label="Возрастное ограничение" options={AGES} />

        <div className={s.chipsRow}>
          <span className={shared.label}>Рубрики</span>
          <ChipGroup options={RUBRICS} value={rubrics} onChange={setRubrics} />
        </div>
      </div>

      <div className={s.note}>
        <IconInfo size={17} aria-hidden="true" className={s.noteIcon} />
        <span className={s.noteText}>
          Мероприятие появится в ленте после проверки модератором
        </span>
      </div>

      <button type="submit" className={s.submit}>
        Опубликовать
      </button>
    </Screen>
  );
}
