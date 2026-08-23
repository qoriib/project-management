import { Text } from "@astryxdesign/core";

export interface EntityCodeProps {
  id: string | number | null | undefined;
}

/**
 * Format an entity ID to string.
 * Use this for places that only accept strings (like titles or selector labels).
 */
export function formatEntityCode(id: string | number | null | undefined): string {
  if (id === null || id === undefined || id === "") {
    return "-";
  }
  return String(id);
}

/**
 * Render a standardized entity code using Astryx's Text component with code styling.
 */
export function EntityCode({ id }: EntityCodeProps) {
  if (id === null || id === undefined || id === "") {
    return <Text type="code">-</Text>;
  }
  return <Text type="code">{String(id)}</Text>;
}
