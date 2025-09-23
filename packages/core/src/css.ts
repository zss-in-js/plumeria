import type {
  CSSProperties,
  CreateStyle,
  CreateStyleType,
  CreateTokens,
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
import { defineTokens } from './api/tokens';
import { defineConsts } from './api/consts';
import { rx } from './api/rx';

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

  static defineConsts<const T extends CreateValues>(object: T): T {
    return defineConsts(object);
  }

  static defineTokens<const T extends CreateTokens>(
    object: T,
  ): ReturnVariableType<T> {
    return defineTokens(object);
  }
}

const css = StyleSheet;

export { css, rx };
export type { CreateStyle, CSSProperties };
