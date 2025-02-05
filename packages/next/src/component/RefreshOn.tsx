'use client';
import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isDevTools } from './isDevtools';

export const RefreshOn = (): null => {
  const router = useRouter();
  const pathname = usePathname();
  const isRefreshing = useRef(false);
  const timeoutId = useRef<NodeJS.Timeout>(undefined);
  const timeout = isDevTools() ? 2200 : 120;

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      if (pathname && response.status === 200 && !isRefreshing.current) {
        isRefreshing.current = true;
        router.refresh();
        router.refresh();
        timeoutId.current = setTimeout(() => {
          isRefreshing.current = false;
        }, timeout);
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
      clearTimeout(timeoutId.current);
    };
  }, [pathname, router, timeout]);

  return null;
};
