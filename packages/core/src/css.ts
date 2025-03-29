import type {
  CreateStyle,
  CustomHTMLType,
  CustomProperties,
  KeyframesDefinition,
  ReturnType,
  VarsDefinition,
} from 'zss-engine';
import { create } from './method/create.js';
import { global } from './method/global.js';
import { defineThemeVars } from './method/define-theme-vars.js';
import { keyframes } from './method/keyframes.js';
import { media, pseudo, colors, container } from '@plumeria/collection';
import { cx } from './cx.js';
import { rx } from './rx.js';

class css {
  static create<T extends Record<string, CustomProperties>>(
    object: CreateStyle<T>,
  ): ReturnType<T> {
    return create(object);
  }

  static global(object: CustomHTMLType): void {
    return global(object);
  }

  static defineThemeVars<const T extends VarsDefinition>(object: T) {
    return defineThemeVars(object);
  }

  static keyframes(object: KeyframesDefinition): string {
    return keyframes(object);
  }

  static media = media;
  static pseudo = pseudo;
  static colors = colors;
  static container = container;
}

export { css, cx, rx };
