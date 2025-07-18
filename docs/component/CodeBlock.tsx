import { codeToHtml } from 'shiki';
import { css } from '@plumeria/core';

const styles = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    width: '340px',
    padding: '18px 28px',
    marginBottom: 10,
    fontSize: 12,
    background: '#F5F5F5',
    borderRadius: '8px',
    [css.media.maxWidth(804)]: {
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
      light: 'everforest-light',
      dark: 'poimandres',
    },
    defaultColor: false,
  });
  return (
    <figure className={styles.$code_div}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
