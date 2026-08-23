import { HStack, Heading, Text, VStack } from "@astryxdesign/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ title, subtitle, actions, compact = true }: PageHeaderProps) {
  return (
    <HStack gap={3} align="start" justify="between" style={{ flexWrap: "wrap", rowGap: "var(--spacing-2)" }}>
      <VStack gap={0.5} width="100%" style={{ flex: "1 1 280px", minWidth: "240px" }}>
        <Heading level={compact ? 3 : 2} style={{ letterSpacing: "-0.015em", lineHeight: "1.2" }}>
          {title}
        </Heading>
        {subtitle && (
          <Text size="sm" color="secondary" style={{ lineHeight: "1.5", overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal" }}>
            {subtitle}
          </Text>
        )}
      </VStack>
      {actions && (
        <HStack gap={2} align="center" style={{ flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {actions}
        </HStack>
      )}
    </HStack>
  );
}
