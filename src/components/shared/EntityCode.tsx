import { Code } from "@astryxdesign/core";

export interface EntityCodeProps {
  prefix: string;
  id: string | number | null | undefined;
  padding?: number;
}

/**
 * Format an entity ID with a prefix and padding.
 * Use this for places that only accept strings (like titles or selector labels).
 */
export function formatEntityCode(prefix: string, id: string | number | null | undefined, padding: number = 4): string {
  if (id === null || id === undefined) return "-";
  const formattedId = String(id).padStart(padding, "0");
  if (!prefix) return formattedId;
  return `${prefix}-${formattedId}`;
}

/**
 * Render a standardized entity code using Astryx's Code component.
 */
export function EntityCode({ prefix, id, padding = 4 }: EntityCodeProps) {
  return <Code style={{ background: "transparent", padding: 0 }}>{formatEntityCode(prefix, id, padding)}</Code>;
}
