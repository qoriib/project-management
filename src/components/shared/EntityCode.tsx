import { Text, type TextSize } from "@astryxdesign/core";

export interface EntityCodeProps {
  id: string | number | null | undefined;
  size?: TextSize;
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
export function EntityCode({ id, size }: EntityCodeProps) {
  if (id === null || id === undefined || id === "") {
    return (
      <Text size={size} type="code">
        -
      </Text>
    );
  }
  return (
    <Text size={size} type="code">
      {String(id)}
    </Text>
  );
}
