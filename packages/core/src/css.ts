import type {
  CreateStyle,
  CustomHTMLType,
  CustomProperties,
  KeyframesDefinition,
  ReturnType,
  VarsDefinition,
} from 'zss-utils';
import { create } from 'zss-utils';
import { global } from 'zss-utils';
import { defineThemeVars } from 'zss-utils';
import { keyframes } from 'zss-utils';
import { media, pseudo, colors, container, cx, rx } from 'zss-utils';

class css {
  static create<T extends Record<string, CustomProperties>>(
    object: CreateStyle<T>,
  ): ReturnType<T> {
    return create(object);
  }

  static global = ((called: boolean = false) => {
    return (object: CustomHTMLType) => {
      if (called) {
        throw new Error('css.global() must be one');
      }
      called = true;
      return global(object);
    };
  })();

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
