# Contributing

Thanks for contributing! This page covers the workflow. Code conventions are in
[docs/conventions.md](docs/conventions.md).

## Workflow

1. **Set up** your machine: [docs/getting-started.md](docs/getting-started.md).
2. **Branch** from `main`: `feat/short-description`, `fix/…`, `docs/…`, `chore/…`.
3. **Build** the change, following the [architecture](docs/architecture.md). For a new
   capability, start with `pnpm gen:feature <name>` and the
   [feature guide](docs/feature-guide.md).
4. **Test** it: unit tests for logic, and an E2E test for new user flows.
5. **Verify** locally:

   ```bash
   pnpm check                  # lint, typecheck, format, unit tests
   pnpm build && pnpm test:e2e # when touching routes, caching or actions
   ```

6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org).
   The commit-msg hook checks it:

   ```
   feat(todos): allow editing titles
   ```

7. **Open a PR** and fill in the template. CI must be green before merging. We
   squash-merge.

## Review checklist

Reviewers look for:

- Does it respect feature boundaries and the layering (action → service → repository)?
- Are inputs validated and is authorization checked in every Server Action?
- Are cache tags invalidated after writes?
- Are expected errors handled and shown to the user? Are loading and empty states covered?
- Is it accessible (labels, roles, focus, keyboard)?
- Are there tests, and do the docs/ADRs need an update?

## Changing conventions or architecture

Open a PR that updates the relevant doc. For significant decisions, add an ADR
([docs/adr](docs/adr/README.md)). If a rule can be automated (lint rule, type,
script), automate it.
