const dashedIdentString = '--[a-zA-Z_][a-zA-Z0-9_-]*';
const varString = `var\\(${dashedIdentString}(,\\s*[^\\)]+)?\\)`;
const varRegex = new RegExp(`^${varString}$`);

function getBaselinePositions() {
  const prefixes = ['', 'first ', 'last ', varString + ' '];
  return prefixes.map((prefix) => `${prefix}(baseline|${varString})`);
}

function getOverflowPositions() {
  return ['unsafe', 'safe', varString];
}

function getContentDistributions() {
  return [
    'space-between',
    'space-around',
    'space-evenly',
    'stretch',
    varString,
  ];
}

function getContentPositions() {
  return ['center', 'start', 'end', 'flex-start', 'flex-end', varString];
}

function getAlignContent() {
  const results = ['normal', varString];

  results.push(...getBaselinePositions());
  results.push(...getContentDistributions());

  const contentPositions = getContentPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...contentPositions);

  overflowPositions.forEach((overflow) => {
    contentPositions.forEach((pos) => {
      results.push(`${overflow} ${pos}`);
    });
  });

  return results;
}

function getJustifyContent() {
  const results = ['normal', varString];

  results.push(...getContentDistributions());

  const contentPositions = getContentPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...contentPositions);

  const positions = contentPositions.concat(['left', 'right', varString]);
  overflowPositions.forEach((overflow) => {
    positions.forEach((pos) => {
      results.push(`${overflow} ${pos}`);
    });
  });

  return results;
}

function generatePlaceContentPattern() {
  const alignContent = getAlignContent();
  const justifyContent = getJustifyContent();

  const pattern = [];

  alignContent.forEach((align) => {
    pattern.push(align);
  });

  alignContent.forEach((align) => {
    justifyContent.forEach((justify) => {
      pattern.push(`${align} ${justify}`);
    });
  });

  return new RegExp(`^(${pattern.join('|')})$`);
}

function getPositions() {
  return [
    'center',
    'start',
    'end',
    'self-start',
    'self-end',
    'flex-start',
    'flex-end',
    varString,
  ];
}

function getAlignItems() {
  const results = ['normal', 'stretch', 'anchor-center', varString];

  results.push(...getBaselinePositions());

  const selfPositions = getPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...selfPositions);

  overflowPositions.forEach((overflow) => {
    selfPositions.forEach((selfPos) => {
      results.push(`${overflow} ${selfPos}`);
    });
  });

  return results;
}

function getJustifyItems() {
  const results = ['normal', 'stretch', 'anchor-center', 'legacy', varString];

  results.push(...getBaselinePositions());
  results.push('legacy left', 'legacy right', 'legacy center');
  results.push('left', 'right');

  const selfPositions = getPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...selfPositions);

  const positions = selfPositions.concat(['left', 'right', varString]);
  overflowPositions.forEach((overflow) => {
    positions.forEach((pos) => {
      results.push(`${overflow} ${pos}`);
    });
  });

  return results;
}

function generatePlaceItemsPattern() {
  const alignItems = getAlignItems();
  const justifyItems = getJustifyItems();

  const pattern = [];

  alignItems.forEach((align) => {
    pattern.push(align);
  });

  alignItems.forEach((align) => {
    justifyItems.forEach((justify) => {
      pattern.push(`${align} ${justify}`);
    });
  });

  return new RegExp(`^(${pattern.join('|')})$`);
}

function getAlignSelf() {
  const results = ['auto', 'normal', 'stretch', 'anchor-center', varString];

  results.push(...getBaselinePositions());

  const selfPositions = getPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...selfPositions);

  overflowPositions.forEach((overflow) => {
    selfPositions.forEach((selfPos) => {
      results.push(`${overflow} ${selfPos}`);
    });
  });

  return results;
}

function getJustifySelf() {
  const results = ['auto', 'normal', 'stretch', 'anchor-center', varString];

  results.push(...getBaselinePositions());

  const selfPositions = getPositions();
  const overflowPositions = getOverflowPositions();

  results.push(...selfPositions);

  const positions = selfPositions.concat(['left', 'right', varString]);
  overflowPositions.forEach((overflow) => {
    positions.forEach((pos) => {
      results.push(`${overflow} ${pos}`);
    });
  });

  return results;
}

function generatePlaceSelfPattern() {
  const alignSelf = getAlignSelf();
  const justifySelf = getJustifySelf();

  const pattern = [];

  alignSelf.forEach((align) => {
    pattern.push(align);
  });

  alignSelf.forEach((align) => {
    justifySelf.forEach((justify) => {
      pattern.push(`${align} ${justify}`);
    });
  });

  return new RegExp(`^(${pattern.join('|')})$`);
}

function isValidPlaceContent(value) {
  const trimmedValue = value.trim();
  if (trimmedValue !== value) {
    return false;
  }

  if (varRegex.test(trimmedValue)) {
    return true;
  }

  const pattern = generatePlaceContentPattern();
  return pattern.test(trimmedValue);
}

function isValidPlaceItems(value) {
  const trimmedValue = value.trim();
  if (trimmedValue !== value) {
    return false;
  }

  if (varRegex.test(trimmedValue)) {
    return true;
  }

  const pattern = generatePlaceItemsPattern();
  return pattern.test(trimmedValue);
}

function isValidPlaceSelf(value) {
  const trimmedValue = value.trim();
  if (trimmedValue !== value) {
    return false;
  }

  if (varRegex.test(trimmedValue)) {
    return true;
  }

  const pattern = generatePlaceSelfPattern();
  return pattern.test(trimmedValue);
}

function isValidTouchAction(value) {
  const basicValues = ['auto', 'none', 'manipulation'];
  const panX = ['pan-x', 'pan-left', 'pan-right'];
  const panY = ['pan-y', 'pan-up', 'pan-down'];
  const pinchZoom = ['pinch-zoom'];

  const allValues = [...basicValues, ...panX, ...panY, ...pinchZoom];
  const usedValues = new Set();

  const trimmedValue = value.trim();
  if (value !== trimmedValue) {
    return false;
  }

  const tokens = trimmedValue.split(/\s+/);

  return tokens.every((token) => {
    if (token.startsWith('var(') && varRegex.test(token)) {
      return true;
    }

    if (allValues.includes(token)) {
      if (basicValues.includes(token)) {
        return tokens.length === 1;
      }

      if (panX.includes(token) && usedValues.has('pan-x')) {
        return false;
      }

      if (panY.includes(token) && usedValues.has('pan-y')) {
        return false;
      }

      return !usedValues.has(token) && usedValues.add(token);
    }

    return false;
  });
}

module.exports = {
  isValidPlaceContent,
  isValidPlaceItems,
  isValidPlaceSelf,
  isValidTouchAction,
};
