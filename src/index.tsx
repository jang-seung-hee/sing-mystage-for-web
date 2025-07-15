import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// import Sentry from '@sentry/react';
// import { BrowserTracing } from '@sentry/tracing';

// Sentry error monitoring (only in production)
// if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.REACT_APP_SENTRY_DSN,
//     integrations: [new BrowserTracing()],
//     tracesSampleRate: 0.2,
//   });
// }

// 시스템 다크/라이트 모드 감지 및 Tailwind 'dark' 클래스 자동 적용
const setDarkModeClass = () => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
};
setDarkModeClass();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setDarkModeClass);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
