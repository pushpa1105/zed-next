# Styling and UI

## Stack

- **Tailwind CSS 4**: CSS-first config in `src/app/globals.css` (no `tailwind.config.js`),
  compiled by the Turbopack loader `@tailwindcss/turbopack`.
- **Design tokens**: CSS variables for semantic colours and radii, with light and dark values.
  Every UI library sits behind an adapter (see [dependencies](dependencies.md)):

| Use                                                      | Import from          | Library behind it          |
| -------------------------------------------------------- | -------------------- | -------------------------- |
| `cn()`: compose classes, last one wins                   | `@/lib/utils`        | `clsx` + `tailwind-merge`  |
| `variants()`, `VariantProps`                             | `@/lib/variants`     | `class-variance-authority` |
| Semantic icons (`AddIcon`, `DeleteIcon`…)                | `@/components/icons` | `lucide-react`             |
| `useTheme()` → `{ preference, resolved, setPreference }` | `@/hooks/use-theme`  | `next-themes`              |

## Design tokens

Tokens are defined in `globals.css`:

```css
:root  { --primary: oklch(0.205 0 0); ... }   /* light */
.dark  { --primary: oklch(0.922 0 0); ... }   /* dark  */

@theme inline { --color-primary: var(--primary); ... }  /* exposes bg-primary, text-primary… */
```

| Token                            | Use for                                 |
| -------------------------------- | --------------------------------------- |
| `background` / `foreground`      | Page background and default text        |
| `card` / `card-foreground`       | Raised surfaces                         |
| `primary` / `primary-foreground` | Main actions                            |
| `secondary`, `accent`, `muted`   | Secondary surfaces, hovers, subtle text |
| `destructive`, `success`         | Errors and success                      |
| `border`, `input`, `ring`        | Borders, form fields, focus rings       |

**Rule:** components use semantic tokens (`bg-primary`, `text-muted-foreground`), never
raw palette colours (`bg-zinc-900`). To re-brand, change token values in one file.

## UI primitives (`src/components/ui`)

| Component        | Notes                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         | Variants `default, secondary, destructive, outline, ghost, link`. Sizes `sm, md, lg, icon`. `loading` prop. Defaults to `type="button"` |
| `buttonVariants` | Apply button styles to a `<Link>`                                                                                                       |
| `Input`, `Label` | Styled native elements. Use `aria-invalid` for the error state                                                                          |
| `Card*`          | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                                                       |
| `Skeleton`       | Loading placeholders for `<Suspense>` fallbacks                                                                                         |
| `FormMessage`    | Accessible field and form messages (`role="alert"`)                                                                                     |

Primitives follow the [shadcn/ui](https://ui.shadcn.com) conventions (`data-slot`,
`cn`, variants, React 19 `ref` as a prop), so you can add more components with the
shadcn CLI or by copying them in. Afterwards, replace their direct `cva` and
`lucide-react` imports with `@/lib/variants` and `@/components/icons` (`pnpm lint`
points out each one):

```bash
pnpm dlx shadcn@latest init     # once: point it at src/components/ui and globals.css
pnpm dlx shadcn@latest add dialog dropdown-menu
```

### Writing a new primitive

```tsx
import { variants, type VariantProps } from "@/lib/variants";

const badgeVariants = variants("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground", outline: "border" },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
```

## Icons

Icons are exported from `src/components/icons.tsx` under **semantic names**: what
they mean in this product, not what the glyph is called. To add one, find it on
[lucide.dev/icons](https://lucide.dev/icons) and re-export it there:

```ts
export { Trash2 as DeleteIcon, Pencil as EditIcon } from "lucide-react";
```

Type icon props with `Icon` from `@/components/icons`, never with a vendor type.

## Dark mode

The theme provider (`src/components/providers/theme-provider.tsx`) toggles the
`.dark` class on `<html>`. Components read or change the theme only through
`useTheme()` from `@/hooks/use-theme`. Tailwind's `dark:` variant is wired
to that class with `@custom-variant dark (&:where(.dark, .dark *))`. Avoid reading the
theme during render (it's unknown on the server). Prefer CSS (`dark:` classes), as
`ThemeToggle` does.

## Fonts

Geist Sans and Geist Mono load through `next/font/google` in the root layout. They are
self-hosted at build time, with no layout shift. They're exposed as `--font-sans` and
`--font-mono` (`font-sans`, `font-mono` utilities).

## Accessibility checklist

- Interactive elements are real `<button>`/`<a>`/`<input>`, not clickable `<div>`s.
- Every input has a `<Label htmlFor>` or `aria-label`.
- Errors use `aria-invalid` + `aria-describedby` + `FormMessage`.
- Icon-only buttons have an `aria-label`. Decorative icons have `aria-hidden`.
- Focus rings are visible (`focus-visible:ring-*`), and there's a "Skip to content" link.
- Motion respects `prefers-reduced-motion` (handled globally in `globals.css`).
