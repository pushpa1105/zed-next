import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithUser, screen } from "@/test/utils";

import { MainNav } from "../main-nav";
import { SiteFooter } from "../site-footer";
import { SiteHeader } from "../site-header";
import { ThemeToggle } from "../theme-toggle";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const theme = vi.hoisted(() => ({
  resolved: "light" as "light" | "dark",
  setPreference: vi.fn(),
}));
vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({ preference: "system", ...theme }),
}));

describe("MainNav", () => {
  it("marks the current section as the active page", () => {
    navigation.pathname = "/todos";
    renderWithUser(<MainNav />);

    expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => theme.setPreference.mockReset());

  it.each([
    ["light", "dark"],
    ["dark", "light"],
  ] as const)("switches from %s to %s", async (current, next) => {
    theme.resolved = current;
    const { user } = renderWithUser(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(theme.setPreference).toHaveBeenCalledWith(next);
  });
});

describe("SiteHeader and SiteFooter", () => {
  it("render the brand, navigation and source link", () => {
    renderWithUser(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });
});
