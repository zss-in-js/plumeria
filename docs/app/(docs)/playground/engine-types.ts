export type SpellingPolicy = 'off' | 'logical' | 'physical';

export type LintFix = { range: [number, number]; text: string };

export type LintMessage = {
  ruleId: string | null;
  message: string;
  severity: number;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: LintFix;
  suggestions?: { desc: string; fix: LintFix }[];
};

export type QuickInfo = {
  signature: string;
  displayParts?: { text: string; kind: string }[];
  documentation: string;
  tags: string;
  start: number;
  length: number;
};

export type Completion = {
  name: string;
  kind: string;
  sortText: string;
  insertText?: string;
  start?: number;
  length?: number;
};

export type Diagnostic = {
  message: string;
  start: number;
  length: number;
};

export type Session = {
  update: (file: string, source: string) => void;
  quickInfo: (file: string, offset: number) => QuickInfo | null;
  completions: (file: string, offset: number, trigger?: string) => Completion[];
  classifications: (file: string, start: number, length: number) => readonly number[];
  diagnostics: (file: string) => Diagnostic[];
  lint: (file: string, source: string, policy: SpellingPolicy) => LintMessage[];
  fix: (file: string, source: string, policy: SpellingPolicy) => string;
  transpile: (file: string, source: string) => string;
};

export type Engine = {
  tokenTypes: readonly string[];
  createSession: (files: Record<string, string>, libs: Record<string, string>) => Promise<Session>;
};
