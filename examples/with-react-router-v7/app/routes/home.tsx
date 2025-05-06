import type { Route } from './+types/home';
import { Welcome } from '../welcome/welcome';

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { content: 'Welcome to React Router!', name: 'description' },
  ];
}

export default function Home() {
  return <Welcome />;
}
