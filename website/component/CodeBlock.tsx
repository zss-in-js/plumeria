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
    background: '#F5F5F5',
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

const demoCode = ` text: { fontSize: 16, color: 'pink' }
 ↓
.text_lgulad { font-size: 16px; color: pink; }`;

export const CodeBlock = async () => {
  const tsx = await codeToHtml(demoCode, {
    lang: 'text',
    themes: {
      light: 'everforest-light',
      dark: 'poimandres',
    },
    defaultColor: false,
  });
  return (
    <figure className={styles.code_div}>
      <pre dangerouslySetInnerHTML={{ __html: tsx }} />
    </figure>
  );
};
