import type {
  CreateStyle,
  CustomHTMLType,
  CustomProperties,
  KeyframesDefinition,
  ReturnType,
  VarsDefinition,
} from 'zss-engine';
import {
  create,
  global,
  defineThemeVars,
  keyframes,
  media,
  pseudo,
  colors,
  container,
  cx,
  rx,
} from 'zss-utils';

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
