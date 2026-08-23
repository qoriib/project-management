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
    <HStack gap={3} align="start" justify="between" wrap="wrap">
      <VStack gap={0.5}>
        <Heading level={compact ? 3 : 2}>{title}</Heading>
        {subtitle && (
          <Text size="sm" color="secondary" wordBreak="break-word" textWrap="wrap">
            {subtitle}
          </Text>
        )}
      </VStack>
      {actions && (
        <HStack gap={2} align="center" justify="end" wrap="wrap">
          {actions}
        </HStack>
      )}
    </HStack>
  );
}
