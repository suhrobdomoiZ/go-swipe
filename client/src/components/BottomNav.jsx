import { NavLink } from 'react-router-dom';
import { IconCards, IconHeart, IconPlus, IconUser } from './icons';
import shared from '../styles/shared.module.css';
import s from './BottomNav.module.css';

const linkClass = ({ isActive }) => (isActive ? `${s.link} ${s.linkActive}` : s.link);

export default function BottomNav() {
  return (
    <nav className={`${shared.glass} ${s.nav}`}>
      <NavLink to="/" className={linkClass} end>
        <IconCards size={23} />
        <span className={s.label}>Свайпы</span>
      </NavLink>

      <NavLink to="/favorites" className={linkClass}>
        <IconHeart size={23} />
        <span className={s.label}>Избранное</span>
      </NavLink>

      <NavLink to="/create" className={linkClass}>
        <span className={s.plus}>
          <IconPlus size={19} strokeLinejoin="round" />
        </span>
        <span className={s.label}>Создать</span>
      </NavLink>

      <NavLink to="/profile" className={linkClass}>
        <IconUser size={23} />
        <span className={s.label}>Профиль</span>
      </NavLink>
    </nav>
  );
}
