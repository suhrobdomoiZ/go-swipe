import { Component } from 'react';
import Centered from './Centered';
import ErrorState from './ErrorState';
import { setToken } from '../api/client';
import { notifyReady } from '../lib/max';

/**
 * Последний рубеж: если отрисовка упала, React снимает всё дерево и остаётся пустой фон.
 * Вместо этого показываем сообщение и перезапуск с чистым входом.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Приложение упало при отрисовке', error, info.componentStack);
    // Заставка MAX должна уйти и при падении, иначе поверх ошибки останется чёрный экран.
    notifyReady();
  }

  restart = () => {
    setToken(null);
    window.location.replace('/');
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Centered>
        <ErrorState
          title="Что-то пошло не так"
          text="Перезапусти приложение — войдём заново."
          hint={String(this.state.error?.message ?? this.state.error)}
          actionLabel="Перезапустить"
          onAction={this.restart}
        />
      </Centered>
    );
  }
}
