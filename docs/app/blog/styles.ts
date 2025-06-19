import { css } from '@plumeria/core';

export const styles = css.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '960px',
    paddingInline: '24px',
    paddingTop: '56px',
    margin: '0 auto',
  },
  header: {
    paddingBottom: '32px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(156,163,175,0.2)',
  },
  title: {
    marginBottom: '16px',
    fontSize: 40,
    fontWeight: '700',
  },

  card: {
    padding: '24px',
    textDecoration: 'none',
    borderRadius: '16px',
    transition: 'background 0.2s ease',
    ':hover': {
      background: 'rgba(0,0,0,0.03)',
    },
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
  cardDesc: {
    marginTop: '8px',
    fontSize: '14px',
    opacity: 0.8,
  },
  cardDate: {
    marginTop: '8px',
    fontSize: '12px',
    opacity: 0.5,
  },
});
