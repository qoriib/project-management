import { EmptyState } from "@astryxdesign/core/EmptyState";
import type { ReactNode } from "react";

interface TableEmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  isCompact?: boolean;
}

export function TableEmptyState({
  title,
  message,
  description,
  icon,
  actions,
  isCompact = true,
}: TableEmptyStateProps) {
  const displayTitle = title || message || "Tidak ada data";
  return (
    <EmptyState title={displayTitle} description={description} icon={icon} actions={actions} isCompact={isCompact} />
  );
}
