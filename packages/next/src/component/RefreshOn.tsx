'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isDevTools } from './isDevtools';

export const RefreshOn = () => {
  const router = useRouter();
  const clickFlagRef = useRef(false);
  useEffect(() => {
    let timeoutObserve: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      const targetAnchor = (e.target as HTMLElement).closest('a');
      if (
        targetAnchor instanceof HTMLAnchorElement &&
        targetAnchor.origin === window.location.origin &&
        targetAnchor.pathname !== window.location.pathname
      ) {
        router.refresh();
      }
    };

    let isRefreshing = false;
    const observeStyleSheets = () => {
      const styleObserver = new MutationObserver(mutations => {
        const devtimeout = isDevTools() ? 1800 : 1;
        const timeout = clickFlagRef.current ? 3600 : devtimeout;

        if (isRefreshing) return;

        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            if (
              addedNodes.some(
                node =>
                  node instanceof HTMLStyleElement ||
                  (node instanceof HTMLLinkElement && !(node.rel === 'preload' && node.getAttribute('as') === 'style'))
              )
            ) {
              isRefreshing = true;
              router.refresh();
              clearTimeout(timeoutObserve);
              timeoutObserve = setTimeout(() => {
                isRefreshing = false;
              }, timeout);
              break;
            }
          }
        }
      });

      styleObserver.observe(document.head, { childList: true });
      return styleObserver;
    };

    document.addEventListener('click', handleClick);
    const cssObserver = observeStyleSheets();

    return () => {
      document.removeEventListener('click', handleClick);
      cssObserver.disconnect();
      clearTimeout(timeoutObserve);
    };
  }, [router]);

  return null;
};
