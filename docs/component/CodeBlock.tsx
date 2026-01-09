import { codeToHtml } from 'shiki';
import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

const stylesCode = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    width: '100%',
    maxWidth: '600px',
    padding: '20px 24px',
    overflow: 'hidden',
    fontFamily: 'var(--font-geist-mono)',
    fontSize: 13,
    border: '1px solid var(--card-border)',
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    [breakpoints.md]: {
      maxWidth: '340px',
      padding: '20px 24px',
      overflowX: 'scroll',
      textAlign: 'left',
    },
  },
});

export const CodeBlock = async ({ code, lang }: { code: string; lang: string }) => {
  const tsx = await codeToHtml(code, {
    lang: lang,
    themes: {
      light: 'snazzy-light',
      dark: 'laserwave',
    },
    defaultColor: false,
  });
  return (
    <figure className={css.props(stylesCode.code_div)}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
