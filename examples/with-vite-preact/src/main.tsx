import { render } from 'preact';
import './index.css';
import '@plumeria/core/stylesheet.css';
import { App } from './app.tsx';
const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('App element not found');
}
render(<App />, appElement);
