'use client';
import { useEffect, useRef } from 'react';
import sdk from '@stackblitz/sdk';

const files = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Plumeria Playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
  'src/App.tsx': `import { useState } from 'react'
import * as css from '@plumeria/core'

const styles = css.create({
  container: {
    padding: '2rem',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'center',
    background: '#242424',
    color: 'rgba(255, 255, 255, 0.87)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    backgroundSize: '400% 400%',
    animation: 'gradient 15s ease infinite',
    marginBottom: '2rem',
  },
  button: {
    padding: '0.6em 1.2em',
    fontSize: '1em',
    fontWeight: 500,
    fontFamily: 'inherit',
    backgroundColor: '#1a1a1a',
    cursor: 'pointer',
    transition: 'border-color 0.25s',
    border: '1px solid transparent',
    borderRadius: '8px',
    color: 'white',
    ':hover': {
      borderColor: '#646cff',
    },
    ':focus': {
      outline: '4px auto -webkit-focus-ring-color',
    },
  },
  text: {
    marginTop: '1.5rem',
    fontSize: '1.1rem',
    color: '#888',
  }
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className={css.props(styles.container)}>
      <h1 className={css.props(styles.title)}>Plumeria Playground</h1>
      <div className="card">
        <button 
          className={css.props(styles.button)}
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p className={css.props(styles.text)}>
          Edit <code>src/App.tsx</code> to see changes instantly!
        </p>
      </div>
    </div>
  )
}

export default App`,
  'src/index.css': `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
}
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
  'src/vite-env.d.ts': `/// <reference types="vite/client" />`,
  'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { plumeria } from '@plumeria/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), plumeria()],
})`,
  'package.json': `{
  "name": "plumeria-playground",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "@plumeria/core": "latest",
    "csstype": "^3.1.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react-swc": "^3.0.0",
    "typescript": "^5.0.0",
    "typescript-eslint": "^8.44.0",
    "vite": "^7.1.1",
    "@plumeria/vite-plugin": "latest"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
  'tsconfig.node.json': `{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
  'node_modules/@plumeria/core/package.json': `{
  "name": "@plumeria/core",
  "version": "0.0.0",
  "types": "./lib/css.d.ts",
  "main": "./lib/css.js",
  "exports": {
    ".": {
      "types": "./lib/css.d.ts",
      "import": "./lib/css.js"
    }
  }
}`,
  'node_modules/@plumeria/core/lib/css.js': `export {};`,
  'node_modules/@plumeria/core/lib/css.d.ts': `/**
 * Type definitions only. No runtime implementation provided.
 * Configure the bundler plugin to extract and implement these APIs.
 */
declare module '@plumeria/core' {
  import type {
    CreateStyleType,
    CreateStatic,
    CreateTheme,
    Keyframes,
    ViewTransition,
    ReturnType,
    ReturnVariableType,
    Variants,
    Marker,
    Extended,
  } from './types';

  export type CSSProperties = import('./types').CSSProperties;
  export type CreateStyle = import('./types').CreateStyle;

  export type create = <const T extends Record<string, CSSProperties>>(rule: CreateStyleType<T>)=> ReturnType<T>;
  export type props = (...rules: (false | CSSProperties | null | undefined)[])=> string;
  export type createTheme = <const T extends CreateTheme>(rule: T)=> ReturnVariableType<T>;
  export type createStatic = <const T extends CreateStatic>(rule: T)=> T;
  export type keyframes = (rule: Keyframes) => string;
  export type viewTransition = (rule: ViewTransition) => string;
  export type variants = <T extends Variants>(rule: T) => (props: { [K in keyof T]?: keyof T[K] }) => CSSProperties;
  export type marker = (id: string, pseudo: string) => Marker;
  export type extended = <I extends string, P extends string>(id: I, pseudo: P) => Extended<I, P>;

  export const create: create;
  export const props: props;
  export const createTheme: createTheme;
  export const createStatic: createStatic;
  export const keyframes: keyframes;
  export const viewTransition: viewTransition;
  export const variants: variants;
  export const marker: marker;
  export const extended: extended;
}`,
  'node_modules/@plumeria/core/lib/types.d.ts': `import type { Properties, Property } from 'csstype';

type CSSVariableKey = \`--\${string}\`;
type CSSVariableValue = \`var(\${CSSVariableKey})\`;
type CSSVariableProperty = { [key: CSSVariableKey]: string | number };

type ColorValue = Exclude<Property.Color, '-moz-initial'> | (string & {});
type CSSColorProperty = Exclude<ColorValue, SystemColorKeyword>;

type SystemColorKeyword =
  | 'ActiveBorder'
  | 'ActiveCaption'
  | 'AppWorkspace'
  | 'Background'
  | 'ButtonFace'
  | 'ButtonHighlight'
  | 'ButtonShadow'
  | 'ButtonText'
  | 'CaptionText'
  | 'GrayText'
  | 'Highlight'
  | 'HighlightText'
  | 'InactiveBorder'
  | 'InactiveCaption'
  | 'InactiveCaptionText'
  | 'InfoBackground'
  | 'InfoText'
  | 'Menu'
  | 'MenuText'
  | 'Scrollbar'
  | 'ThreeDDarkShadow'
  | 'ThreeDFace'
  | 'ThreeDHighlight'
  | 'ThreeDLightShadow'
  | 'ThreeDShadow'
  | 'Window'
  | 'WindowFrame'
  | 'WindowText';

type ExcludeMozInitial<T> = Exclude<T, '-moz-initial'>;

type CSSTypeProperties = Properties<number | (string & {})>;

type CustomProperties = {
  [K in keyof CSSTypeProperties]: ExcludeMozInitial<CSSTypeProperties[K]>;
};

type BaseCSSProperties = {
  [K in keyof CustomProperties]: CustomProperties[K] | CSSVariableValue;
};

interface CommonProperties extends BaseCSSProperties {
  accentColor?: CSSColorProperty;
  color?: CSSColorProperty;
  borderLeftColor?: CSSColorProperty;
  borderRightColor?: CSSColorProperty;
  borderTopColor?: CSSColorProperty;
  borderBottomColor?: CSSColorProperty;
  borderBlockColor?: CSSColorProperty;
  borderBlockStartColor?: CSSColorProperty;
  borderBlockEndColor?: CSSColorProperty;
  borderInlineColor?: CSSColorProperty;
  borderInlineStartColor?: CSSColorProperty;
  borderInlineEndColor?: CSSColorProperty;
  backgroundColor?: CSSColorProperty;
  outlineColor?: CSSColorProperty;
  textDecorationColor?: CSSColorProperty;
  caretColor?: CSSColorProperty;
  columnRuleColor?: CSSColorProperty;
}

type ArrayString = \`[\${string}\`;
type ArraySelector = {
  [key in ArrayString]: CommonProperties | CSSVariableProperty;
};

type ColonString = \`:\${string}\`;
type ColonSelector = {
  [key in ColonString]: CommonProperties | CSSVariableProperty;
};

type Query = \`@media \${string}\` | \`@container \${string}\`;
type QuerySelector = {
  [K in Query]:
    | CommonProperties
    | ColonSelector
    | ArraySelector
    | CSSVariableProperty;
};

type CSSProperties =
  | CommonProperties
  | ArraySelector
  | ColonSelector
  | QuerySelector
  | CSSVariableProperty;

type CreateStyleType<T> = {
  readonly [K in keyof T]: T[K] extends CSSProperties ? CSSProperties : T[K];
};

type CreateStyle = {
  [key: string]: CSSProperties;
};

type ReturnType<T> = {
  [K in keyof T]: Readonly<{
    [P in keyof T[K]]: T[K][P];
  }>;
};

type CreateStatic = Record<string, string | number>;

type CreateTheme = Record<string, Record<string, string | number>>;
type ReturnVariableType<T> = { [K in keyof T]: CSSVariableValue };

type KeyframesInSelector = 'from' | 'to' | \`\${number}%\`;
type Keyframes = {
  [K in KeyframesInSelector]?: CSSProperties;
};

type ViewTransition = {
  group?: CSSProperties;
  imagePair?: CSSProperties;
  new?: CSSProperties;
  old?: CSSProperties;
};

type Variants = Record<string, Record<string, CSSProperties>>;

type Marker = Record<string, CSSProperties>;

type StripColon<T extends string> = T extends \`:\${infer R}\`
  ? StripColon<R>
  : T;

type Extended<I extends string, P extends string> = \`@container style(--\${I}-\${StripColon<P>}: 1)\`;

export type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  CreateStatic,
  CreateTheme,
  Keyframes,
  ViewTransition,
  ReturnType,
  ReturnVariableType,
  Variants,
  Marker,
  Extended,
};`,
};

export function Playground() {
  const ref = useRef<HTMLDivElement>(null);
  const embedded = useRef(false);

  useEffect(() => {
    if (!ref.current || embedded.current) return;
    embedded.current = true;

    // Safety check for sdk
    if (!sdk || typeof sdk.embedProject !== 'function') {
      console.error('StackBlitz SDK not loaded correctly', sdk);
      return;
    }

    sdk.embedProject(
      ref.current,
      {
        title: 'Plumeria Playground',
        description: 'Interactive playground for Plumeria',
        template: 'node',
        files: files,
        settings: {
          compile: {
            trigger: 'auto',
            clearConsole: false,
          },
        },
      },
      {
        height: '100%',
        openFile: 'src/App.tsx',
        view: 'default',
      },
    );
  }, []);

  return (
    <div
      ref={ref}
      id="embed-container"
      style={{
        height: '100%',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#1e1e1e',
      }}
    />
  );
}
