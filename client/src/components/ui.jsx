import { Link } from 'react-router-dom';
import { IconBack, IconChevronDown } from './icons';
import shared from '../styles/shared.module.css';
import s from './ui.module.css';

export function BackHeader({ to, title }) {
  return (
    <div className={s.backHeader}>
      <Link to={to} aria-label="Назад" className={s.backBtn}>
        <IconBack size={20} />
      </Link>
      <h1 className={s.backTitle}>{title}</h1>
    </div>
  );
}

export function Select({ id, label, options, ...rest }) {
  return (
    <div className={shared.formRow}>
      <label className={shared.label} htmlFor={id}>{label}</label>
      <div className={shared.select}>
        <select id={id} className={shared.field} {...rest}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <IconChevronDown size={18} className={shared.selectChev} aria-hidden="true" />
      </div>
    </div>
  );
}

export function ChipGroup({ options, value, onChange }) {
  const toggle = (label) =>
    onChange(value.includes(label) ? value.filter((v) => v !== label) : [...value, label]);

  return (
    <div className={s.chips}>
      {options.map((label) => (
        <button
          key={label}
          type="button"
          aria-pressed={value.includes(label)}
          onClick={() => toggle(label)}
          className={value.includes(label) ? `${shared.chipBtn} ${shared.chipOn}` : shared.chipBtn}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className={s.empty}>
      {icon}
      <h2 className={s.emptyTitle}>{title}</h2>
      <p className={s.emptyText}>{text}</p>
      {action}
    </div>
  );
}
