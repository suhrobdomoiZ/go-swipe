import Blobs from './Blobs';
import BottomNav from './BottomNav';
import s from './Screen.module.css';

/**
 * Общий каркас экрана: фон с блобами и колонка контента.
 *
 * preset — пресет блобов; без него фон не рисуется
 * nav    — показать нижнюю навигацию
 * as     — тег контента (например, 'form'), остальные пропсы уходят на него
 * className — дополнительный класс контента (отступы конкретного экрана)
 */
export default function Screen({ preset, nav = false, as: Tag = 'div', className, children, ...rest }) {
  return (
    <div className={s.screen}>
      {preset && <Blobs preset={preset} />}

      <Tag className={className ? `${s.content} ${className}` : s.content} {...rest}>
        {children}
        {nav && <BottomNav />}
      </Tag>
    </div>
  );
}
