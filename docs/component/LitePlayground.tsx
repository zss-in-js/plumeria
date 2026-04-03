'use client';

import { useState, useEffect, useRef } from 'react';

const defaultCode = `import { useState } from 'react'
import * as css from '@plumeria/core'

const styles = css.create({
  container: {
    minHeight: '100vh',
    padding: '2rem',
    background: 'radial-gradient(circle at 30% 30%, #1a1a2e, #16213e)',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#e0e0e0',
  },

  card: {
    background: 'rgba(20, 20, 40, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: '2.5rem',
    padding: '2.5rem 2rem',
    width: '360px',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(160, 130, 255, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
    textAlign: 'center',

    ':hover': {
      boxShadow: '0 40px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(140, 100, 255, 0.5)',
      borderColor: '#a08aff',
      transform: 'scale(1.02)',
    },
  },

  avatar: {
    fontSize: '5rem',
    lineHeight: 1,
    marginBottom: '1rem',
    filter: 'drop-shadow(0 10px 15px rgba(160, 130, 255, 0.4))',
    transition: 'transform 0.3s ease',

    ':hover': {
      transform: 'rotate(8deg) scale(1.1)',
    },
  },

  name: {
    fontSize: '2.2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #c0b0ff, #ffb3d9)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.02em',
    textShadow: '0 0 20px rgba(200, 160, 255, 0.6)',
  },

  bio: {
    fontSize: '1rem',
    color: '#b0b0d0',
    marginBottom: '2rem',
    padding: '0 1rem',
    fontStyle: 'italic',
    borderBottom: '1px dashed rgba(160, 130, 255, 0.5)',
    paddingBottom: '1.5rem',
  },

  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '2rem',
  },

  statItem: {
    textAlign: 'center',
  },

  statValue: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#ffffff',
    textShadow: '0 0 15px #a08aff',
    lineHeight: 1.2,
  },

  statLabel: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#b0b0d0',
  },

  button: {
    padding: '0.8rem 2rem',
    fontSize: '1.2rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #a08aff, #ff8ab5)',
    color: 'white',
    border: 'none',
    borderRadius: '3rem',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(160, 130, 255, 0.5)',
    transition: 'all 0.3s ease',
    width: '100%',
    textTransform: 'uppercase',
    letterSpacing: '1px',

    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 35px rgba(160, 130, 255, 0.7)',
      background: 'linear-gradient(45deg, #b4a3ff, #ffa5c8)',
    },

    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 5px 15px rgba(160, 130, 255, 0.6)',
    },
  },

  buttonFollowing: {
    background: 'linear-gradient(45deg, #3a3a5a, #5a5a8a)',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',

    ':hover': {
      background: 'linear-gradient(45deg, #4a4a6a, #6a6a9a)',
    },
  },
})

export default function ProfileCard() {
  const [isFollowing, setIsFollowing] = useState(false)

  const toggleFollow = () => setIsFollowing(!isFollowing)

  return (
    <div styleName={styles.container}>
      <div styleName={styles.card}>
        <div styleName={styles.avatar}>🦊</div>
        <h2 styleName={styles.name}>Kitsune</h2>
        <p styleName={styles.bio}>
          🍜 Plumeria artist ·  Designing rich experiences with CSS-in-JS
        </p>

        <div styleName={styles.statsContainer}>
          <div styleName={styles.statItem}>
            <div styleName={styles.statValue}>128</div>
            <div styleName={styles.statLabel}>posts</div>
          </div>
          <div styleName={styles.statItem}>
            <div styleName={styles.statValue}>1.2k</div>
            <div styleName={styles.statLabel}>followers</div>
          </div>
          <div styleName={styles.statItem}>
            <div styleName={styles.statValue}>350</div>
            <div styleName={styles.statLabel}>following</div>
          </div>
        </div>

        <button
          styleName={[
            styles.button,
            isFollowing && styles.buttonFollowing
          ]}
          onClick={toggleFollow}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  )
}
`;

import { compileCode } from '../lib/compiler';

interface Compiled {
  code: string;
  css: string;
  classMap: Record<string, string>;
}

export function LitePlayground() {
  const [editorCode, setEditorCode] = useState(defaultCode);
  const [compiled, setCompiled] = useState<Compiled>({
    code: defaultCode,
    css: '',
    classMap: {},
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCompiling, setIsCompiling] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setIsCompiling(true);
    try {
      const data = compileCode(editorCode) as any;
      if (data && data.css !== undefined) {
        setCompiled({
          code: data.code || editorCode,
          css: data.css,
          classMap: data.classMap || {},
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsCompiling(false), 500);
    }
  }, [editorCode]);

  // -- Initialization of iframe (only when mounted)
  useEffect(() => {
    if (!iframeRef.current) return;

    const runtimeCode = `
    window.__CLASS_MAP = {};
    let styleElement = null;

    function getStyleElement() {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'plumeria-extracted-styles';
        document.head.appendChild(styleElement);
      }
      return styleElement;
    }

    window.Plumeria = {
      create: (rules) => {
        const res = {};
        for (const [ruleKey, v] of Object.entries(rules)) {
          const classes = [];
          for (const [p, val] of Object.entries(v)) {
            if (typeof val === 'object') {
              const pseudo = p.startsWith('&') ? p.slice(1) : p;
              for (const [pp] of Object.entries(val)) {
                const key = ruleKey + ':' + pseudo + ':' + pp;
                if (window.__CLASS_MAP[key]) classes.push(window.__CLASS_MAP[key]);
              }
            } else {
              const key = ruleKey + ':' + p;
              if (window.__CLASS_MAP[key]) classes.push(window.__CLASS_MAP[key]);
            }
          }
          res[ruleKey] = classes.join(' ');
        }
        return res;
      },
      use: (...args) => {
        const classes = [];
        const process = (val) => {
          if (!val) return;
          if (Array.isArray(val)) {
            val.forEach(process);
          } else if (typeof val === 'string') {
            classes.push(val);
          }
        };
        args.forEach(process);
        return [...new Set(classes)].join(' ');
      },
    };

    let root = null;

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data.type !== 'full-update') return;
      if (data.css !== undefined) getStyleElement().textContent = data.css;
      if (data.classMap !== undefined) window.__CLASS_MAP = data.classMap;

      const style = window.Plumeria;
      const css = window.Plumeria;
      const { useState, useEffect, useMemo, useRef, useCallback } = React;

      try {
        const cleaned = data.code
          .replace(/^import\\s+.*?from\\s+['"][^'"]+['"].*;?\\s*$/gm, '')
          .replace('export default', 'const App =');

        const transformed = Babel.transform(cleaned + '\\n; window.__App = App;', {
          presets: ['react'],
        }).code;

        eval(transformed);
        const App = window.__App;

        const rootEl = document.getElementById('root');

        if (!root) {
          rootEl.style.opacity = '0';
          root = ReactDOM.createRoot(rootEl);
        }

        function AppWithReveal() {
          React.useLayoutEffect(() => {
            rootEl.style.opacity = '1';
          }, []);
          return React.createElement(App);
        }

        root.render(React.createElement(AppWithReveal));
      } catch (e) {
        console.error('[Iframe] Render error:', e);
      }
    });
  `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script>${runtimeCode}</script>
          <style>
            body { margin: 0; background: #2c2828; color: #fff; overflow-wrap: break-word; }
            #root { height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            window.parent.postMessage({ type: 'ready' }, '*');
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    iframeRef.current.src = URL.createObjectURL(blob);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ready') setIsReady(true);
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframeRef.current?.src) URL.revokeObjectURL(iframeRef.current.src);
    };
  }, []);

  useEffect(() => {
    if (!iframeRef.current || !isReady) return;
    iframeRef.current.contentWindow?.postMessage(
      {
        type: 'full-update',
        css: compiled.css,
        classMap: compiled.classMap,
        code: compiled.code,
      },
      '*',
    );
  }, [isReady, compiled]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        height: '100%',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          borderRight: isMobile ? 'none' : '1px solid #333',
          borderTop: isMobile ? '1px solid #333' : 'none',
          position: 'relative',
          backgroundColor: '#1e1e1e',
          height: isMobile ? '60%' : '100%',
        }}
      >
        <textarea
          value={editorCode}
          onChange={(e) => setEditorCode(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            color: '#d4d4d4',
            border: 'none',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            tabSize: 2,
            boxSizing: 'border-box',
          }}
          spellCheck={false}
        />
      </div>
      <div
        style={{
          flex: isMobile ? undefined : 1,
          flexBasis: isMobile ? '40%' : undefined,
          backgroundColor: '#2c2828',
          height: isMobile ? '40%' : '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {(!isReady || isCompiling) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2c2828',
              zIndex: 1,
              color: '#a78bfa',
              fontSize: '14px',
            }}
          >
            {isCompiling ? 'Compiling Styles...' : 'Loading...'}
          </div>
        )}
        <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
      </div>
    </div>
  );
}
