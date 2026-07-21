// Resolved via the "production" export condition.
// Intentionally has no 'use client' directive: without a client entry the
// bundler emits no chunk at all, so the inspector costs 0KB in production.
// To run the inspector in production, import from '@plumeria/inspector/production'.
export const Inspector = (_props: { initial?: boolean }): null => null;
