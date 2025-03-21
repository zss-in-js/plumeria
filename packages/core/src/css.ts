import type {
  CreateStyle,
  CustomHTMLType,
  CustomProperties,
  KeyframesDefinition,
  ReturnType,
  VarsDefinition,
} from 'zss-engine';
import { create } from './method/create';
import { global } from './method/global';
import { defineThemeVars } from './method/define-theme-vars';
import { keyframes } from './method/keyframes';
import { media, pseudo, colors, container } from '@plumeria/collection';
import { cx } from './cx';
import { rx } from './rx';

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
