/**
 * @fileoverview Disallow the logical name of a property that also has a physical name
 */

import { createSpellingRule } from '../util/spellingRule';

export const noLogicalProperties = createSpellingRule('logical');
