import type {
  CSSProperties,
  CSSHTML,
  CreateStyle,
  CreateStyleType,
  CreateTheme,
  CreateValues,
  CreateKeyframes,
  ReturnType,
  Join,
  ReturnVariableType,
  RxVariableSet,
  ReturnRx,
} from 'zss-engine';

import { create } from './main/create';
import { global } from './main/global';
import { props } from './main/props';
import { px, rx } from './main/utilities';
import { keyframes } from './define/keyframes';
import { defineVars } from './define/vars';
import { defineTheme } from './define/theme';
import { defineConsts } from './define/consts';
import { media, container, color, ps } from 'zss-utils';

class css {
  private constructor() {}

  static create<const T extends Record<string, CSSProperties>>(
    object: CreateStyleType<T>,
  ): ReturnType<T> {
    return create(object);
  }

  static global(object: CSSHTML): void {
    return global(object);
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

  static props(
    ...objects: (false | Readonly<CSSProperties> | null | undefined)[]
  ): string {
    return props(...objects);
  }

  static rx(
    cssProperties: Readonly<CSSProperties>,
    varSet: RxVariableSet,
  ): ReturnRx {
    return rx(cssProperties, varSet);
  }

  static px<T extends readonly string[]>(...pseudos: T): Join<T> {
    return px(...pseudos);
  }

  static media = media;
  static container = container;
  static color = color;
}

export { css, ps, px, rx };
export type { CreateStyle, CSSHTML, CSSProperties };
