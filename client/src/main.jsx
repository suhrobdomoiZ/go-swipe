import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Диагностика: в вебвью MAX нет консоли, поэтому необработанные ошибки (вне рендера React)
// выводим поверх экрана. Boundary их не ловит, а без этого видно только чёрный экран.
function showFatal(reason) {
  const text = String(reason?.stack ?? reason?.message ?? reason).slice(0, 600);
  let box = document.getElementById('fatal-error');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'fatal-error';
    box.style.cssText = 'position:fixed;inset:auto 0 0 0;max-height:50%;overflow:auto;margin:0;padding:12px;'
      + 'background:#300;color:#fdd;font:11px/1.4 monospace;white-space:pre-wrap;z-index:99999';
    document.body.appendChild(box);
  }
  box.textContent += `${text}\n\n`;
}
window.addEventListener('error', (e) => showFatal(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => showFatal(e.reason));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
