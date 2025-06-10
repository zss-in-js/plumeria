/* eslint-disable no-empty-pattern */
/* eslint-disable @plumeria/validate-values */
import type { Route } from './+types/home';
import { Welcome } from '../welcome/welcome';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { content: 'Welcome to React Router!', name: 'description' },
  ];
}

export default function Home() {
  return <Welcome />;
}
