/// <reference types="vite/client" />
// vue-shim declare types
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, any>;
  export default component;
}
