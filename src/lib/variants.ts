/**
 * Component-variant adapter: the ONLY module that imports
 * class-variance-authority. Components import `variants` / `VariantProps` from
 * here, so migrating to `tailwind-variants` or a cva major version changes
 * this file only.
 */
export { type VariantProps, cva as variants } from "class-variance-authority";
