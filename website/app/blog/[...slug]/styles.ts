import { css } from '@plumeria/core';

export const styles = css.create({
  article: {
    width: '800px',
    paddingInline: 24,
    paddingTop: '24px',
    marginInline: 'auto',
    marginBottom: '40px',
    lineHeight: 1.7,
  },
  backLinkWrapper: {
    marginBottom: '24px',
  },
  backLink: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    fontSize: '14px',

    textDecoration: 'none',
    transition: 'color 0.2s',
    ':hover': {
      color: 'gray',
    },
  },
  title: {
    marginBottom: '12px',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginBottom: '8px',
    fontSize: '16px',
  },
  date: {
    marginBottom: '32px',
    fontSize: '14px',
  },
});

css.global({
  h1: {
    fontWeight: 200,
  },
  h2: {
    padding: '20px 0',
    fontSize: 24,
  },
});
