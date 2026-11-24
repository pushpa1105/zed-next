/**
 * Icon registry: the ONLY module that imports the icon library.
 *
 * Icons are exported under *semantic* names (what they mean in this product),
 * not vendor names. Swapping lucide for another set, or changing which glyph
 * means "delete", is a one-file change. Named re-exports keep tree-shaking
 * intact: only the icons you use are bundled.
 *
 * To add an icon: browse https://lucide.dev/icons, then re-export it below
 * under a semantic name.
 */
import type { ComponentType } from "react";

/** Props every icon accepts. Keep this vendor-neutral. */
export interface IconProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

/** Any icon component. Use this type instead of a vendor type in props. */
export type Icon = ComponentType<IconProps>;

// Keep alphabetical by semantic name (enforced by simple-import-sort).
export {
  Plus as AddIcon,
  AlertTriangle as AlertIcon,
  Moon as DarkModeIcon,
  Trash2 as DeleteIcon,
  Workflow as DeliveryIcon,
  Sun as LightModeIcon,
  Boxes as ModulesIcon,
  Gauge as PerformanceIcon,
  ShieldCheck as SecurityIcon,
  Loader2 as SpinnerIcon,
  FlaskConical as TestingIcon,
  Wrench as ToolingIcon,
} from "lucide-react";
