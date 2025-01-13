'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const RefreshOn = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleSave = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        router.refresh();
      }
    },
    [router]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetAnchor = target.closest('a');
      if (pathname && targetAnchor instanceof HTMLAnchorElement && targetAnchor.origin === window.location.origin) {
        router.refresh();
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    document.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleSave);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleSave);
    };
  }, [router, pathname]);

  return null;
};
