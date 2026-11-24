import {
  DeliveryIcon,
  type Icon,
  ModulesIcon,
  PerformanceIcon,
  SecurityIcon,
  TestingIcon,
  ToolingIcon,
} from "@/components/icons";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/*
 * Route-private component: the `_components` folder is not routable and
 * lives next to the only page that uses it. Promote it to a feature or to
 * `src/components` only when a second consumer appears.
 */

const FEATURES: { icon: Icon; title: string; description: string }[] = [
  {
    icon: ModulesIcon,
    title: "Feature-based architecture",
    description:
      "Self-contained feature modules with public APIs and lint-enforced boundaries.",
  },
  {
    icon: PerformanceIcon,
    title: "Cache Components",
    description:
      "Partial prerendering with `use cache`, cache tags and React Compiler enabled.",
  },
  {
    icon: SecurityIcon,
    title: "Secure by default",
    description:
      "Validated env vars, validated Server Actions, security headers, `server-only`.",
  },
  {
    icon: TestingIcon,
    title: "Tested",
    description: "Vitest + Testing Library for units, Playwright for end-to-end flows.",
  },
  {
    icon: ToolingIcon,
    title: "Replaceable dependencies",
    description:
      "Every third-party library sits behind one adapter file. Swap it in one place.",
  },
  {
    icon: DeliveryIcon,
    title: "Production ready",
    description:
      "GitHub Actions CI, Docker standalone image, health checks, structured logs.",
  },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="pb-24">
      <h2 id="features-heading" className="sr-only">
        Features
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: FeatureIcon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <FeatureIcon
                className="mb-2 size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
