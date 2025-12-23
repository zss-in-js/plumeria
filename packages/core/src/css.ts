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
    rule: CreateStyleType<T>,
  ): ReturnType<T> {
    return create(rule);
  }

  static props(
    ...rules: (false | Readonly<CSSProperties> | null | undefined)[]
  ): string {
    return props(...rules);
  }

  static keyframes(rule: CreateKeyframes): string {
    return keyframes(rule);
  }

  static viewTransition(rule: ViewTransitionOptions): string {
    return viewTransition(rule);
  }

  static createTheme<const T extends CreateTheme>(
    rule: T,
  ): ReturnVariableType<T> {
    return createTheme(rule);
  }

  static createStatic<const T extends CreateValues>(rule: T): T {
    return createStatic(rule);
  }
}

const css = StyleSheet;

export { css, x };
export type { CreateStyle, CSSProperties };
