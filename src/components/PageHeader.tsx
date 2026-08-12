import { HStack, Heading, Text, VStack } from "@astryxdesign/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <HStack gap={4} align={subtitle ? "start" : "center"} style={{ marginBottom: "var(--spacing-4)" }}>
      <VStack gap={0.5} style={{ flex: 1 }}>
        <Heading size="lg">{title}</Heading>
        {subtitle && <Text color="secondary">{subtitle}</Text>}
      </VStack>
      {actions && <HStack gap={2}>{actions}</HStack>}
    </HStack>
  );
}
