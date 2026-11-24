# Architecture Decision Records

An ADR records **one significant decision**: the context, the choice, and its
consequences. ADRs make "why is it like this?" answerable years later.

## Index

| #    | Title                                                                                       | Status   |
| ---- | ------------------------------------------------------------------------------------------- | -------- |
| 0001 | [Feature-based architecture](0001-feature-based-architecture.md)                            | Accepted |
| 0002 | [Cache Components and Server Actions for data](0002-cache-components-and-server-actions.md) | Accepted |
| 0003 | [Repository and service layers inside features](0003-repository-and-service-layers.md)      | Accepted |
| 0004 | [Tooling baseline](0004-tooling-baseline.md)                                                | Accepted |
| 0005 | [Isolate third-party libraries behind adapters](0005-vendor-adapters.md)                    | Accepted |

## Writing a new ADR

1. Copy [`template.md`](template.md) to `NNNN-short-title.md`, using the next number.
2. Fill it in. Keep it to one page.
3. Open a PR. The discussion happens there.
4. Never rewrite an accepted ADR. To change a decision, write a new ADR and mark the
   old one `Superseded by NNNN`.
