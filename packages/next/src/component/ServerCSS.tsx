import { isDevServer, getServerCSS } from 'zss-engine';
import { RefreshOn } from './RefreshOn';
import { JSX } from 'react';

export const ServerCSS = (): JSX.Element | null => {
  if (!isDevServer) return null;

  const serverCSS = getServerCSS();

  return (
    <>
      <RefreshOn />
      <style dangerouslySetInnerHTML={{ __html: serverCSS }} />
    </>
  );
};
