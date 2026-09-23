export type SpellingPolicy = 'off' | 'logical' | 'physical';

export type LintMessage = {
  ruleId: string | null;
  message: string;
  severity: number;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
};

export type QuickInfo = {
  signature: string;
  documentation: string;
  tags: string;
  start: number;
  length: number;
};

export type Diagnostic = {
  message: string;
  start: number;
  length: number;
};

export type Session = {
  update: (source: string) => void;
  quickInfo: (offset: number) => QuickInfo | null;
  classifications: (start: number, length: number) => readonly number[];
  diagnostics: () => Diagnostic[];
  lint: (source: string, policy: SpellingPolicy) => LintMessage[];
  transpile: (source: string) => string;
};

export type Engine = {
  tokenTypes: readonly string[];
  createSession: (source: string) => Promise<Session>;
};
