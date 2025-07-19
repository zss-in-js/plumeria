import type {
  CSSProperties,
  CSSHTML,
  CreateStyle,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateKeyframes,
  ReturnType,
  ReturnVariableType,
} from 'zss-engine';

import { create } from './api/create';
import { props } from './api/props';
import { keyframes } from './api/keyframes';
import { defineVars } from './api/vars';
import { defineTheme } from './api/theme';
import { defineConsts } from './api/consts';
import { global } from './api/global';

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

  static defineConsts<const T extends CreateValues>(object: T): CreateValues {
    return defineConsts(object);
  }

  static defineVars<const T extends CreateValues>(
    object: T,
  ): ReturnVariableType<T> {
    return defineVars(object);
  }

  static defineTheme<const T extends CreateTheme>(
    object: T,
  ): ReturnVariableType<T> {
    return defineTheme(object);
  }

  static global(object: CSSHTML): void {
    return global(object);
  }
}

const css = StyleSheet;

export { css };
export type { CreateStyle, CSSHTML, CSSProperties };
