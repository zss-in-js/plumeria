import { codeToHtml } from 'shiki';
import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { CodeBlock as FumadocsCodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

const styles = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    width: '100%',
    maxWidth: '590px',
    overflow: 'hidden',
    [breakpoints.md]: {
      maxWidth: '340px',
      overflowX: 'scroll',
      textAlign: 'left',
    },
  },
  pre: {
    fontFamily: 'var(--font-geist-mono)',
    fontSize: 11,
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
    <FumadocsCodeBlock styleName={styles.code_div}>
      <Pre styleName={styles.pre} dangerouslySetInnerHTML={{ __html: tsx }} />
    </FumadocsCodeBlock>
  );
};
