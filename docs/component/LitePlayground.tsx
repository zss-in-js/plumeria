'use client';

import { useState, useEffect, useRef } from 'react';

const defaultCode = `import { useState } from 'react'
import * as css from '@plumeria/core'

const styles = css.create({
  container: {
    minHeight: '100vh',
    padding: '2rem',
    background: '#2c2828',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'translateY(-30px)',
    color: '#e0e0ff',
  },
  
  title: {
    fontSize: '2.8rem',
    fontWeight: '800',
    background: 'linear-gradient(90deg, #ff6ec7, #7873f5, #00ddeb)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    margin: '0 0 0.4rem 0',
    letterSpacing: '-0.03em',
    textShadow: '0 0 20px rgba(120, 115, 245, 0.6)',
  },

  card: {
    background: 'rgba(30, 30, 60, 0.55)',
    backdropFilter: 'blur(16px)',
    borderRadius: '1.5rem',
    padding: '1rem 2rem',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)',
    border: '1px solid rgba(120, 115, 245, 0.18)',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    textAlign: 'center',

    ":hover": {
      boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(120, 115, 245, 0.35)',
      borderColor: 'rgba(120, 115, 245, 0.5)',
    },
  },

  countDisplay: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#a78bfa',
    margin: '1.5rem 0',
    textShadow: '0 0 25px rgba(167, 139, 250, 0.7)',
    transition: 'transform 0.3s ease, color 0.3s ease',
  },

  button: {
    padding: '0.8rem 1.5rem',
    fontSize: '1.02rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #7c3aed, #ec4899)',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.4)',
    transition: 'all 0.2s ease',

    ":hover": {
      transform: 'translateY(-2px) scale(1.02)',
      background: 'linear-gradient(45deg, #8b5cf6, #f472b6)',
    },

    ":active": {
      transform: 'translateY(-2px) scale(0.98)',
    },
  },
})

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className={css.props(styles.container)}>
      <h1 className={css.props(styles.title)}>Playground</h1>

      <div className={css.props(styles.card)}>
        <div className={css.props(styles.countDisplay)}>
          {count}
        </div>

        <button
          className={css.props(styles.button)}
          onClick={() => setCount(c => c + 1)}
        >
          Click to Increment
        </button>
      </div>
    </div>
  )
}
`;

export function LitePlayground() {
  const [code, setCode] = useState(defaultCode);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Initial load
    if (!iframeRef.current) return;

    const runtimeCode = `
      const styleCache = new Map();
      let styleElement = null;
      function getStyleElement() {
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'plumeria-runtime-styles';
          document.head.appendChild(styleElement);
        }
        return styleElement;
      }
      const hyphenate = (s) => s.replace(/[A-Z]/g, '-$&').toLowerCase();
      function registerRule(prop, value, pseudo = '') {
        const className = 'p-' + hyphenate(prop) + '-' + String(value).replace(/[^a-zA-Z0-9]/g, '-');
        const selector = '.' + className + pseudo;
        if (!styleCache.has(selector)) {
          const el = getStyleElement();
          const rule = selector + ' { ' + hyphenate(prop) + ': ' + value + '; }';
          el.sheet.insertRule(rule, el.sheet.cssRules.length);
          styleCache.set(selector, className);
        }
        return className;
      }
      window.Plumeria = {
        create: (rules) => {
          const res = {};
          for (const [k, v] of Object.entries(rules)) {
            const classes = [];
            for (const [p, val] of Object.entries(v)) {
              if (typeof val === 'object') {
                const pseudo = p.startsWith('&') ? p.slice(1) : p;
                for (const [pp, vv] of Object.entries(val)) classes.push(registerRule(pp, vv, pseudo));
              } else classes.push(registerRule(p, val));
            }
            res[k] = classes.join(' ');
          }
          return res;
        },
        props: (...args) => args.filter(Boolean).join(' ')
      };
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
            body { margin: 0; font-family: sans-serif; height: 100vh; background: #2c2828; overflow: hidden; }
            #root { height: 100%; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // Signal ready to parent
            window.parent.postMessage('ready', '*');
            
            let root = null;
            window.addEventListener('message', (event) => {
              const code = event.data;
              if (typeof code !== 'string') return;
              
              const { useState } = React;
              const css = window.Plumeria;
              
              try {
                const transformed = Babel.transform(
                  code.replace(/import .* from .*/g, '').replace('export default', 'const App = ') + '\\n; window.__App = App;',
                  { presets: ['react'] }
                ).code;
                
                eval(transformed);
                const App = window.__App;
                
                if (!root) {
                  root = ReactDOM.createRoot(document.getElementById('root'));
                }
                root.render(React.createElement(App));
              } catch (e) {
                console.error(e);
              }
            });
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    iframeRef.current.src = URL.createObjectURL(blob);

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'ready') {
        setIsReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (iframeRef.current && isReady) {
      iframeRef.current.contentWindow?.postMessage(code, '*');
    }
  }, [code, isReady]);

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
          flex: isMobile ? '1' : 1,
          borderRight: isMobile ? 'none' : '1px solid #333',
          borderTop: isMobile ? '1px solid #333' : 'none',
          position: 'relative',
          backgroundColor: '#1e1e1e',
          height: isMobile ? '60%' : '100%',
        }}
      >
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
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
          }}
          spellCheck={false}
        />
      </div>
      <div
        style={{
          flex: isMobile ? '0 0 40%' : 1,
          backgroundColor: '#2c2828',
          height: isMobile ? '40%' : '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {!isReady && (
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
            Loading...
          </div>
        )}
        <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
      </div>
    </div>
  );
}
