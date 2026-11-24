## What & why

<!-- What does this change and why is it needed? Link the issue: Closes #123 -->

## How to test

<!-- Steps a reviewer can follow to verify the change. -->

## Checklist

- [ ] `pnpm check` passes locally (lint, typecheck, format, unit tests)
- [ ] Added/updated tests for new behaviour
- [ ] New env vars are added to `src/config/env.ts` **and** `.env.example`
- [ ] Feature code respects boundaries (public API only: `@/features/<name>`)
- [ ] Docs updated (`README.md` / `docs/`) if behaviour or conventions changed
- [ ] Screenshots attached for UI changes
