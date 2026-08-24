import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";

function SettingsAppearance() {
  const { resolvedMode, toggleThemeMode } = useAppStore(
    useShallow((s) => ({
      resolvedMode: s.resolvedMode,
      toggleThemeMode: s.toggleThemeMode,
    })),
  );

  const isDark = resolvedMode === "dark";

  return (
    <VStack gap={4} width="100%">
      <VStack gap={1}>
        <Heading level={3}>Tampilan Aplikasi</Heading>
        <Text type="supporting" color="secondary">
          Kelola mode tampilan terang dan gelap aplikasi sesuai kenyamanan Anda.
        </Text>
      </VStack>

      <Card padding={4}>
        <VStack gap={4}>
          <HStack align="center" justify="between">
            <VStack gap={0}>
              <Text weight="semibold">Mode Terang / Gelap</Text>
              <Text size="sm" color="secondary">
                Ubah skema warna antara mode terang dan mode gelap.
              </Text>
            </VStack>
            <Button
              variant="secondary"
              onClick={toggleThemeMode}
              label={isDark ? "Ganti ke Terang" : "Ganti ke Gelap"}
              icon={isDark ? <Sun /> : <Moon />}
            />
          </HStack>
        </VStack>
      </Card>
    </VStack>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: SettingsAppearance,
});
