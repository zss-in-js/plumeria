'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isDevTools } from './isDevtools';

const globalRefreshState = {
  isRefreshing: false,
  timeoutId: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const RefreshOn = (): null => {
  const router = useRouter();
  const pathname = usePathname();
  const timeout = isDevTools() ? 2200 : 120;

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      if (
        pathname &&
        response.status === 200 &&
        !globalRefreshState.isRefreshing
      ) {
        globalRefreshState.isRefreshing = true;
        queueMicrotask(() => {
          process.nextTick(() => {
            router.refresh();
            globalRefreshState.timeoutId = setTimeout(() => {
              globalRefreshState.isRefreshing = false;
            }, timeout);
          });
        });
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
      if (globalRefreshState.timeoutId) {
        clearTimeout(globalRefreshState.timeoutId);
      }
    };
  }, [pathname, router, timeout]);

  return null;
};
