/**
 * Test adapter: the ONLY module (with ./setup.ts) that imports Testing Library.
 *
 * Tests import from `@/test/utils`, so upgrading Testing Library, adding
 * app-wide providers to every render, or switching tools is a one-file change.
 * The API surface is exported explicitly, on purpose: add what you need here.
 */
import {
  act,
  render,
  renderHook,
  type RenderOptions,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

/**
 * Render a component and set up `user-event`. Wrap `ui` in app-level
 * providers here if components start depending on them.
 */
export function renderWithUser(ui: ReactElement, options?: RenderOptions) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  };
}

export { act, render, renderHook, screen, waitFor, within };
