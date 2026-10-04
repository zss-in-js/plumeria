# Contributing to Plumeria

We truly value your interest in contributing to Plumeria! Your help is invaluable, and we're grateful for your efforts in improving this project. Here are some guidelines to get you started.

## AI Usage Policy

You may use AI tools to research, write, and review your contributions. You are still responsible for everything you submit.

- **Understand your work:** Review and test AI-generated code before you submit it, and be ready to explain any part of it in your own words.
- **Write descriptions yourself:** Issue and pull request descriptions must be written by a human. You can use AI to help build a reproduction.
- **Disclose AI use:** If AI generated your issue or pull request, say so in the AI acknowledgment section.
- **Reply as a human:** Answer review comments and questions yourself. Do not paste them into an AI and post its reply. Once a maintainer has replied, do not rewrite the description; post updates as new comments.
- **Open AI-generated pull requests only for confirmed issues:** An AI-generated pull request is reviewed only when it fixes an issue that a maintainer has already confirmed.
- **Keep it short:** Remove filler so that your submission is easy to review.

Issues and pull requests that do not follow this policy may be closed without review. Repeated violations may lead to a block.

## Development Setup

Our project uses `pnpm`. Here's how you can set it up:

1. Clone the repository.
2. In the root directory, run `pnpm install` to install dependencies.
3. To check the test correctly, run `pnpm run test` to unit testing the necessary api.
4. If you make any modifications, please test your changes. We prefer new features to come with tests.
5. Fork the repository and submit your changes as a pull request against the `main` branch.

## Commit Conventions

Save the following as `AGENTS.md` in the root directory, and put `@AGENTS.md` in `CLAUDE.md` so that Claude Code reads it. Both files are ignored by git.

```md
Do not use tokens.

## Commit conventions

- Keep one changed file per commit.
- Follow the recent commit-message style.
- End implementation commit messages with `in filename.ext`.
- Use `chore(scope/__tests__): add/update filename.test.ts` for tests.

Do not react to the generation of zero-virtual.css.
```

## Package Structure

- **@plumeria/codemod**: This package contains codemods that migrate CSS Modules in and out and rename the styling prop.
- **@plumeria/compiler**: The Rust (napi-rs) scanner, transformer and compiler that the bundler integrations use.
- **@plumeria/core**: This package is the core package that defines types only.
- **@plumeria/eslint-plugin**: This package contains the eslint rules to keep Plumeria code clean.
- **@plumeria/headlessui**: This package wraps Radix UI as headless components for Plumeria.
- **@plumeria/init**: This package sets up Plumeria in a project with one command.
- **@plumeria/inspector**: This package contains the styled components inspector for development.
- **@plumeria/next-plugin**: This package contains the Next.js plugin for integrating Plumeria.
- **@plumeria/turbopack-loader**: This package contains the Turbopack loader for integrating Plumeria.
- **@plumeria/unplugin**: This package contains the plugins for Vite, webpack, Rspack, Rollup, Rolldown, esbuild, Farm and Bun.
- **@plumeria/utils**: This package contains the TypeScript reference implementation of the style parse and transform utils functions.

## Changesets

Do not include a changeset in your pull request. The maintainer adds one after merging.
