'use client';

import dynamic from 'next/dynamic';

// Loading it lazily keeps it out of the initial bundle of the routes that share
// the MDX module graph but never render it.
export const HeadlessDemoLazy = dynamic(() => import('./HeadlessDemo').then((m) => m.HeadlessDemo));
