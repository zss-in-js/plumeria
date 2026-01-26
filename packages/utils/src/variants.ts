import { deepMerge } from './parser';
import { getStyleRecords } from './create';

export function processVariants(
  variants: Record<string, Record<string, any>>,
): {
  hashMap: Record<string, any>;
  sheets: string[];
} {
  const sheets: string[] = [];
  const variantKeys = Object.keys(variants);

  // 1. Analyze properties for each variant
  const variantProperties: Record<string, Set<string>> = {};
  variantKeys.forEach((key) => {
    variantProperties[key] = new Set();
    Object.values(variants[key]).forEach((style) => {
      Object.keys(style).forEach((prop) => variantProperties[key].add(prop));
    });
  });

  // 2. Build Conflict Graph
  const conflicts: Record<string, Set<string>> = {};
  variantKeys.forEach((key) => (conflicts[key] = new Set()));

  for (let i = 0; i < variantKeys.length; i++) {
    for (let j = i + 1; j < variantKeys.length; j++) {
      const keyA = variantKeys[i];
      const keyB = variantKeys[j];

      // Check intersection of properties
      let hasConflict = false;
      for (const prop of variantProperties[keyA]) {
        if (variantProperties[keyB].has(prop)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        conflicts[keyA].add(keyB);
        conflicts[keyB].add(keyA);
      }
    }
  }

  // 3. Group Connected Components (Compound Groups)
  const visited = new Set<string>();
  const independentKeys: string[] = [];
  const compoundGroups: string[][] = [];

  variantKeys.forEach((key) => {
    if (visited.has(key)) return;

    // BFS/DFS to find component
    const queue = [key];
    const component = new Set<string>();
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (component.has(curr)) continue;
      component.add(curr);
      visited.add(curr);

      conflicts[curr].forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        } else if (!component.has(neighbor)) {
          // Already visited or added
        }
      });
    }

    if (component.size === 1) {
      independentKeys.push(key);
    } else {
      compoundGroups.push(Array.from(component));
    }
  });

  const hashMap: Record<string, any> = {};

  // 4. Generate Hash Maps

  // Independent: Direct mapping
  independentKeys.forEach((key) => {
    const optionMap: Record<string, string> = {};
    Object.entries(variants[key]).forEach(([optKey, style]) => {
      const records = getStyleRecords(style);
      records.forEach((r) => {
        if (!sheets.includes(r.sheet)) sheets.push(r.sheet);
      });
      optionMap[optKey] = records.map((r) => r.hash).join(' ');
    });
    hashMap[key] = optionMap;
  });

  // Compound: Cartesian Product
  if (compoundGroups.length > 0) {
    hashMap._compound = compoundGroups.map((groupKeys) => {
      const compoundMap: Record<string, string> = {};

      const generateCombinations = (
        depth: number,
        currentCombo: Record<string, string>,
      ) => {
        if (depth === groupKeys.length) {
          let mergedStyle = {};
          const comboKeyParts: string[] = [];

          groupKeys.forEach((k) => {
            const opt = currentCombo[k];
            comboKeyParts.push(opt || 'default');
            if (opt && variants[k][opt]) {
              mergedStyle = deepMerge(mergedStyle, variants[k][opt]);
            }
          });

          const records = getStyleRecords(mergedStyle);
          records.forEach((r) => {
            if (!sheets.includes(r.sheet)) sheets.push(r.sheet);
          });
          const className = records.map((r) => r.hash).join(' ');

          if (className) {
            compoundMap[comboKeyParts.join(':')] = className;
          }
          return;
        }

        const key = groupKeys[depth];
        const options = Object.keys(variants[key]);
        const effectiveOptions = new Set(options);
        effectiveOptions.add('default'); // Always consider default/missing case

        effectiveOptions.forEach((opt) => {
          generateCombinations(depth + 1, { ...currentCombo, [key]: opt });
        });
      };

      generateCombinations(0, {});

      return {
        keys: groupKeys,
        map: compoundMap,
      };
    });
  }

  return {
    hashMap,
    sheets,
  };
}
