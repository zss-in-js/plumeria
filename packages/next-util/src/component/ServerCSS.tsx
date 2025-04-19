import { isDevelopment, getServerCSS } from 'zss-utils';
import { RefreshOn } from './RefreshOn';
import { JSX } from 'react';

export const ServerCSS = (): JSX.Element | null => {
  if (!isDevelopment) return null;

  const serverCSS = getServerCSS();

  return (
    <>
      <RefreshOn key={serverCSS} />
      <style>{serverCSS}</style>
    </>
  );
};
