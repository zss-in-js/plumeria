import type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateKeyframes,
  ReturnType,
  ReturnVariableType,
  ViewTransitionOptions,
} from 'zss-engine';

import { create } from './api/create';
import { props } from './api/props';
import { keyframes } from './api/keyframes';
import { viewTransition } from './api/viewTransition';
import { createTheme } from './api/createTheme';
import { createStatic } from './api/createStatic';
import { x } from './api/x';

class StyleSheet {
  private constructor() {}

  static create<const T extends Record<string, CSSProperties>>(
    object: CreateStyleType<T>,
  ): ReturnType<T> {
    return create(object);
  }

  static props(
    ...objects: (false | Readonly<CSSProperties> | null | undefined)[]
  ): string {
    return props(...objects);
  }

  static keyframes(object: CreateKeyframes): string {
    return keyframes(object);
  }

  static viewTransition(object: ViewTransitionOptions): string {
    return viewTransition(object);
  }

  static createTheme<const T extends CreateTheme>(
    object: T,
  ): ReturnVariableType<T> {
    return createTheme(object);
  }

  static createStatic<const T extends CreateValues>(object: T): T {
    return createStatic(object);
  }
}

const css = StyleSheet;

export { css, x };
export type { CreateStyle, CSSProperties };
