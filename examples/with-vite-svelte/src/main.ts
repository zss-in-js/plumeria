import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import '@plumeria/core/stylesheet.css';

const appElement = document.getElementById('app');
if (!appElement) {
  throw new Error('App element not found');
}

const app = mount(App, {
  target: appElement,
});

export default app;
