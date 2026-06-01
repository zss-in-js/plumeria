'use cache';

import * as css from '@plumeria/core';
import { theme } from 'lib/theme';

const pulse = css.keyframes({
  '0%': {
    opacity: 0.6,
  },
  '50%': {
    opacity: 1,
  },
  '100%': {
    opacity: 0.6,
  },
});

const styles = css.create({
  container: {
    position: 'relative',
    display: 'inline-flex',
    gap: 16,
    alignItems: 'center',
    padding: '8px 24px 8px 10px',
    overflow: 'hidden',
    textDecoration: 'none',
    cursor: 'pointer',
    borderRadius: 48,
  },
  avatarContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.1,
    color: '#2aaaca',
    letterSpacing: '-0.02em',
  },
  company: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.2,
    color: theme.textSecondary,
    opacity: 0.8,
  },
  skeleton: {
    background: theme.iconBg,
    borderRadius: 4,
  },
  pulseAnimation: {
    animation: `${pulse} 2s infinite ease-in-out`,
  },
});

interface GitHubUserProps {
  username: string;
  subtext?: string;
}

export const GitHubUser = async ({ username, subtext }: GitHubUserProps) => {
  let user = null;

  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      cache: 'force-cache',
    });
    if (res.ok) {
      const data = await res.json();
      user = {
        name: data.name || data.login,
        avatar_url: data.avatar_url,
        company: data.company,
        html_url: data.html_url,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch GitHub user: ${username}`, error);
  }

  if (!user) {
    return (
      <div styleName={[styles.container, styles.pulseAnimation]}>
        <div styleName={styles.avatarContainer}>
          <div styleName={[styles.avatar, styles.skeleton]} />
        </div>
        <div styleName={styles.info}>
          <span styleName={styles.name}>User not found</span>
          <span styleName={styles.company}>@{username}</span>
        </div>
      </div>
    );
  }

  return (
    <a
      href={user.html_url}
      target="_blank"
      rel="noopener noreferrer"
      styleName={styles.container}
      id={`github-user-${username}`}
    >
      <div styleName={styles.avatarContainer}>
        <img src={user.avatar_url} alt={user.name} styleName={styles.avatar} />
      </div>
      <div styleName={styles.info}>
        <span styleName={styles.name}>{user.name}</span>
        <span styleName={styles.company}>{subtext || user.company || `@${username}`}</span>
      </div>
    </a>
  );
};
