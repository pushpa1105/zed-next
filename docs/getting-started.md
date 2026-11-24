# Getting started

## Prerequisites

| Tool    | Version            | Notes                                         |
| ------- | ------------------ | --------------------------------------------- |
| Node.js | ≥ 22 (24 in CI)    | `nvm use` / `fnm use` reads `.nvmrc`          |
| pnpm    | 10.x               | `corepack enable` installs the pinned version |
| Git     | any recent version | required for git hooks                        |

> The exact pnpm version is pinned in `package.json` → `packageManager`. Corepack
> uses it automatically, so everyone runs the same version.

## First run

```bash
git clone <repo-url> && cd zed-next
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

- App: <http://localhost:3000>
- Reference feature: <http://localhost:3000/todos>
- Health check: <http://localhost:3000/api/health>

`pnpm install` runs the `prepare` script, which installs the Husky git hooks.

## Daily workflow

```bash
pnpm dev            # develop
pnpm test:watch     # keep unit tests running in a second terminal
pnpm check          # before pushing: lint + typecheck + format + tests
```

Git hooks run automatically:

- **pre-commit**: `lint-staged` runs ESLint `--fix` and Prettier on staged files only.
- **commit-msg**: `commitlint` enforces [Conventional Commits](https://www.conventionalcommits.org)
  (`feat: …`, `fix: …`, `docs: …`). See [conventions](conventions.md#git).

## Editor setup (VS Code)

Accept the recommended extensions when prompted (listed in `.vscode/extensions.json`):
ESLint, Prettier, Tailwind CSS IntelliSense, Vitest, Playwright, EditorConfig.

The workspace settings turn on format-on-save, ESLint fix-on-save, the workspace
TypeScript version, and Tailwind class completion inside `cn()` and `variants()`.

## Troubleshooting

| Symptom                                      | Fix                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Invalid environment variables` on start     | Compare `.env.local` with `.env.example`. See [env docs](environment-variables.md) |
| Types for routes are missing (`LayoutProps`) | Run `pnpm typecheck` (it runs `next typegen` first) or start `pnpm dev`            |
| Git hooks don't run                          | Run `pnpm install` again (it runs `husky`), and check `git config core.hooksPath`  |
| Playwright: browser not installed            | `pnpm exec playwright install chromium`                                            |
| Stale build output                           | `pnpm clean`                                                                       |
