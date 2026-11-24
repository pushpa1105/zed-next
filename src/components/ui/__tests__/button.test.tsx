import { describe, expect, it, vi } from "vitest";

import { renderWithUser, screen } from "@/test/utils";

import { Button } from "../button";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const onClick = vi.fn();
    const { user } = renderWithUser(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("defaults to type=button to avoid accidental form submits", () => {
    renderWithUser(<Button>Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("is disabled and busy while loading", () => {
    renderWithUser(<Button loading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
