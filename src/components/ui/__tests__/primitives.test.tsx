import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";
import { FormMessage } from "../form-message";
import { Skeleton } from "../skeleton";

describe("Card", () => {
  it("renders all slots and merges custom classes", () => {
    render(
      <Card className="custom">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByText("Content").closest("[data-slot=card]")).toHaveClass("custom");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("FormMessage", () => {
  it("renders nothing without content", () => {
    const { container } = render(<FormMessage messages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses role=status for success messages", () => {
    render(<FormMessage tone="success">Saved</FormMessage>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("shows the first error message as an alert", () => {
    render(<FormMessage messages={["First", "Second"]} />);
    expect(screen.getByRole("alert")).toHaveTextContent("First");
  });
});
