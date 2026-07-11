import { codeToHtml } from 'shiki';
import * as css from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';
import { CodeBlock as FumadocsCodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

const styles = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    flexDirection: 'column',
    width: 1000,
    overflow: 'hidden',
    background: 'rgb(24, 24, 27)',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    [breakpoints.md]: {
      maxWidth: '100%',
      overflowX: 'scroll',
      textAlign: 'left',
    },
  },
  pre: {
    padding: '10px 12px',
    fontSize: 12.65,
  },
});

export const CodeBlock = async ({ code, lang }: { code: string; lang: string }) => {
  const tsx = await codeToHtml(code, {
    lang: lang,
    themes: {
      light: 'laserwave',
      dark: 'laserwave',
    },
  });
  return (
    <FumadocsCodeBlock styleName={styles.code_div} title="TypeScript" lang="ts">
      <Pre styleName={styles.pre} dangerouslySetInnerHTML={{ __html: tsx }} />
    </FumadocsCodeBlock>
  );
};
