import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { Select, ChipGroup } from '../components/ui';
import shared from '../styles/shared.module.css';
import s from './OnboardingScreen.module.css';
import { RUBRICS, CITIES } from '../mocks/events';

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [age, setAge] = useState('21');
  const [city, setCity] = useState(CITIES[0]);
  const [rubrics, setRubrics] = useState(['Музыка', 'Технологии', 'Маркеты']);

  const submit = () => {
    // TODO: POST /profile, когда бэк будет готов
    navigate('/');
  };

  return (
    <Screen preset="form" className={s.content}>
      <div className={s.user}>
        <div className={s.avatar}>А</div>
        <div className={s.userCol}>
          <span className={s.userName}>Алексей</span>
          <span className={s.userSource}>данные из MAX</span>
        </div>
      </div>

      <h1 className={s.title}>
        Расскажи<br />о себе
      </h1>
      <p className={s.lead}>
        Подберём мероприятия рядом и по твоим интересам
      </p>

      <div className={`${shared.glass} ${shared.panel}`}>
        <div className={shared.formRow}>
          <label className={shared.label} htmlFor="age">Возраст</label>
          <input id="age" className={shared.field} type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>

        <Select id="city" label="Город" options={CITIES} value={city} onChange={(e) => setCity(e.target.value)} />

        <div className={s.chipsRow}>
          <span className={shared.label}>Что тебе интересно</span>
          <ChipGroup options={RUBRICS} value={rubrics} onChange={setRubrics} />
        </div>
      </div>

      <button type="button" onClick={submit} className={s.submit}>
        Поехали
      </button>
    </Screen>
  );
}
