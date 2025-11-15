'use client';

import dynamic from 'next/dynamic';

const PlaygroundNoSSR = dynamic(() => import('./Playground').then((mod) => mod.Playground), {
  ssr: false,
});

export function Playground() {
  return <PlaygroundNoSSR />;
}
