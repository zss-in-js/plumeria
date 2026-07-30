import { Welcome } from '../welcome/welcome';

export function meta() {
  return [
    { title: 'New React Router App' },
    { content: 'Welcome to React Router!', name: 'description' },
  ];
}

export default function Home() {
  return <Welcome />;
}
