import './app.css';
import App from './App.svelte';
import '@plumeria/core/stylesheet.css';

const app = new App({
  target: document.getElementById('app') as HTMLElement,
});

export default app;
