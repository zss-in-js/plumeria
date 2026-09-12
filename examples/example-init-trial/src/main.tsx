import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const appElement = document.getElementById('root');
if (!appElement) {
  throw new Error('App element not found');
}
createRoot(appElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
