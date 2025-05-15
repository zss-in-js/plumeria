import type {
  CreateStyle,
  CustomHTMLType,
  CustomProperties,
  KeyframesDefinition,
  ReturnType,
  VarsDefinition,
} from 'zss-engine';

import { media, pseudo, color, container } from 'zss-utils';
import { create } from './methods/create';
import { global } from './methods/global';
import { keyframes } from './methods/keyframes';
import { defineThemeVars } from './methods/define-theme-vars';

export class css {
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
  static container = container;
  static pseudo = pseudo;
  static color = color;
}
