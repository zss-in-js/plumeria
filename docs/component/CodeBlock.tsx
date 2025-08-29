import { codeToHtml } from 'shiki';
import { css } from '@plumeria/core';
import { breakpoints } from 'lib/mediaQuery';

const stylesCode = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    width: '340px',
    padding: '18px 28px',
    marginBottom: 10,
    fontSize: 12,
    background: '#ffffff',
    borderRadius: '8px',
    opacity: 0.277,
    [breakpoints.md]: {
      width: '317px',
      padding: '12px 20px',
      fontSize: 10.5,
      transform: 'translate(0%)',
    },
  },
});

export const CodeBlock = async ({ code, lang }: { code: string; lang: string }) => {
  const tsx = await codeToHtml(code, {
    lang: lang,
    themes: {
      light: 'github-light-default',
      dark: 'github-dark-default',
    },
    defaultColor: false,
  });
  return (
    <figure className={css.props(stylesCode.code_div)}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
