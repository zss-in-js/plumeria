'use client';

import * as css from '@plumeria/core';
import { hmrClientWide } from 'component/hmr-client-wide.styles';
import { hmrClientModule } from 'component/hmr-client-mobile-chrome.styles';

const styles = css.create({
  box: {
    backgroundColor: '#a4b5c6',
  },
  text: {
    color: '#a4b5c6',
  },
});

export function HmrClientBox({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <div data-testid="hmr-client-box" classStyle={styles.box}>
        the client module and the stylesheet update separately
      </div>
      <div
        data-testid="hmr-client-ordered"
        classStyle={[styles.text, hmrClientWide.text]}
      >
        a media rule from another file stays on top
      </div>
      <div data-testid="hmr-client-module" classStyle={hmrClientModule.box}>
        the class names of a style module are baked into this component
      </div>
      {children}
    </section>
  );
}
