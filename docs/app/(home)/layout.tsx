'use client';

import { useEffect, type ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from 'app/layout.config';

export default function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('nd-nav');
      if (!nav) return;

      if (window.scrollY > 0) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
