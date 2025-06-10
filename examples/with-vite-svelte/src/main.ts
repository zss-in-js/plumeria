import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import '@plumeria/core/stylesheet.css';

const app = mount(App, {
  target: document.getElementById('app') as HTMLElement,
});

export default app;
