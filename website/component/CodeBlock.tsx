import { codeToHtml } from 'shiki';
import { css } from '@plumeria/core';

const styles = css.create({
  code_div: {
    position: 'relative',
    zIndex: 0,
    display: 'flex',
    width: 'fit-content',
    padding: '18px 28px',
    marginBottom: 20,
    fontSize: 12,
    background: 'black',
    borderRadius: '8px',
    [css.media.maxWidth(804)]: {
      width: '317px',
      padding: '12px 20px',
      marginTop: 20,
      marginBottom: 10,
      fontSize: 10.5,
      transform: 'translate(0%)',
    },
  },
});

export const CodeBlock = async ({ code, lang }: { code: string; lang: string }) => {
  const tsx = await codeToHtml(code, {
    lang: lang,
    themes: {
      light: 'poimandres',
      dark: 'poimandres',
    },
    defaultColor: false,
  });
  return (
    <figure className={css.props(styles.code_div)}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
