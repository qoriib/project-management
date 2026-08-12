import { Card, VStack, Text, Heading } from "@astryxdesign/core";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: string;
  accent?: "positive" | "negative" | "warning" | "neutral";
}

export function StatCard({ label, value, sublabel, icon, accent = "neutral" }: StatCardProps) {
  const accentColor: Record<string, string> = {
    positive: "var(--color-positive-text)",
    negative: "var(--color-negative-text)",
    warning: "var(--color-warning-text)",
    neutral: "var(--color-text-primary)",
  };

  return (
    <Card padding={4}>
      <VStack gap={1}>
        <Text size="sm" color="secondary">
          {icon} {label}
        </Text>
        <Heading
          level={3}
          style={{ color: accentColor[accent], fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </Heading>
        {sublabel && (
          <Text size="2xs" color="secondary">
            {sublabel}
          </Text>
        )}
      </VStack>
    </Card>
  );
}
