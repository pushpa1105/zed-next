import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithUser, screen } from "@/test/utils";

import { ErrorView } from "../error-view";

describe("ErrorView", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows the digest as a support reference", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    renderWithUser(<ErrorView error={error} />);

    expect(screen.getByText("Reference: abc123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  it("calls retry when the user tries again", async () => {
    const retry = vi.fn();
    const { user } = renderWithUser(<ErrorView error={new Error("x")} retry={retry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("hides the retry button when no retry is available", () => {
    renderWithUser(<ErrorView error="string error" title="Custom title" />);
    expect(screen.getByRole("heading", { name: "Custom title" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
