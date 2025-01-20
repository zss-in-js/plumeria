'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const RefreshOn = () => {
  const router = useRouter();

  useEffect(() => {
    let shouldObserve = true;
    let timeoutClick: NodeJS.Timeout;
    let timeoutObserve: NodeJS.Timeout;

    const handleClick = (e: MouseEvent) => {
      const targetAnchor = (e.target as HTMLElement).closest('a');
      if (targetAnchor instanceof HTMLAnchorElement && targetAnchor.origin === window.location.origin && targetAnchor.pathname !== window.location.pathname) {
        shouldObserve = false;
        router.refresh();
        clearTimeout(timeoutClick);
        timeoutClick = setTimeout(() => {
          shouldObserve = true;
        }, 200);
      }
    };

    let isRefreshing = false;
    const observeStyleSheets = () => {
      const styleObserver = new MutationObserver(mutations => {
        if (!shouldObserve || isRefreshing) return;

        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            if (
              addedNodes.some(
                node =>
                  node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && !(node.rel === 'preload' && node.getAttribute('as') === 'style'))
              )
            ) {
              isRefreshing = true;
              router.refresh();
              clearTimeout(timeoutObserve);
              timeoutObserve = setTimeout(() => {
                isRefreshing = false;
              }, 20);
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
      clearTimeout(timeoutClick);
      clearTimeout(timeoutObserve);
    };
  }, [router]);

  return null;
};
