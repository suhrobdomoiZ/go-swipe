import { Component } from 'react';
import { notifyReady } from '../lib/max';
import ErrorState from './ErrorState';
import Screen from './Screen';

/**
 * Последняя защита от пустого экрана: если рендер любого экрана бросил исключение,
 * React размонтирует всё дерево и в MAX остаётся чёрный экран без объяснений.
 * Вместо этого показываем текст ошибки и даём перезагрузить приложение.
 */
export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Необработанная ошибка рендера', error, info?.componentStack);
    notifyReady();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Screen preset="swipe">
        <ErrorState
          title="Приложение упало"
          text="Что-то пошло не так при отображении экрана. Перезагрузи приложение."
          hint={String(error?.message ?? error)}
          actionLabel="Перезагрузить"
          onAction={() => window.location.reload()}
        />
      </Screen>
    );
  }
}
