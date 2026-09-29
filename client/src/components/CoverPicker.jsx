import { useId, useState } from 'react';
import FormError from './FormError';
import { IconImage } from './icons';
import shared from '../styles/shared.module.css';
import s from './CoverPicker.module.css';
import { ApiError, uploadImage } from '../api';

const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Обложка мероприятия: выбранный файл сразу уходит в POST /uploads,
 * наружу (onChange) отдаётся готовый URL для image_url.
 *
 * className    — вид зоны выбора с экрана формы
 * onBusyChange — true, пока идёт загрузка (публиковать в это время нельзя)
 */
export default function CoverPicker({ className, value, onChange, onBusyChange }) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setError('Нужна картинка png, jpeg или webp до 5 МБ.');
      return;
    }

    setError(null);
    setUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400
        ? 'Сервер не принял файл: нужен png, jpeg или webp до 5 МБ.'
        : 'Не получилось загрузить обложку. Попробуй ещё раз.');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <>
      <input
        id={id}
        type="file"
        accept={TYPES.join(',')}
        onChange={pick}
        disabled={uploading}
        className={`${shared.srOnly} ${s.input}`}
      />
      <label htmlFor={id} aria-busy={uploading} className={value ? `${className} ${s.filled}` : className}>
        {value && !uploading ? (
          <>
            <img src={value} alt="" className={s.preview} />
            <span className={`${shared.badge} ${s.over}`}>Заменить обложку</span>
          </>
        ) : (
          <>
            <IconImage size={28} />
            {uploading ? 'Загружаем обложку…' : 'Добавить обложку'}
          </>
        )}
      </label>
      <FormError>{error}</FormError>
    </>
  );
}
