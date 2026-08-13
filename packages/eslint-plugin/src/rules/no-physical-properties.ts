/**
 * @fileoverview Disallow the physical name of a property that also has a logical name
 */

import { createSpellingRule } from '../util/spellingRule';

export const noPhysicalProperties = createSpellingRule('physical');
