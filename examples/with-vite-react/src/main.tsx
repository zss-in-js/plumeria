import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@plumeria/core/stylesheet.css';
import App from './App.tsx';

const appElement = document.getElementById('root');

if (appElement) {
  createRoot(appElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
