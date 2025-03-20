'use client';
import { Analytics } from '@vercel/analytics/next';

export const VercelAnalytics = () => {
  return <Analytics mode="production" />;
};
