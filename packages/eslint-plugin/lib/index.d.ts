import { ESLint, Linter, Rule } from 'eslint';

declare const plugin: ESLint.Plugin & {
  rules: {
    'no-destructure': Rule.RuleModule;
    'no-inner-call': Rule.RuleModule;
    'no-unused-keys': Rule.RuleModule;
    'sort-properties': Rule.RuleModule;
    'validate-values': Rule.RuleModule;
  };
  configs: {
    recommended: Linter.LegacyConfig;
  };
  flatConfigs: {
    recommended: Linter.Config<Linter.RulesRecord>;
  };
};

export = plugin;
