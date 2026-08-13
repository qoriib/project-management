import { HStack, Heading, Text, VStack } from "@astryxdesign/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <HStack gap={4} align="start">
      <VStack gap={0.5} style={{ flex: 1 }}>
        <Heading level={2}>{title}</Heading>
        {subtitle && <Text color="secondary">{subtitle}</Text>}
      </VStack>
      {actions && <HStack gap={2}>{actions}</HStack>}
    </HStack>
  );
}
