import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, Text, VStack, HStack } from "@astryxdesign/core";
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

  const isDark = resolvedMode === "dark"
  const buttonLabel = isDark ? "Ganti ke Terang" : "Ganti ke Gelap"
  const buttonIcon = isDark ? <Sun /> : <Moon />;

  return (
    <HStack align="start" gap={6}>
      <VStack width="100%" gap={1}>
        <Heading level={3}>Tampilan Aplikasi</Heading>
        <Text type="supporting" color="secondary">
          Sesuaikan tema warna aplikasi sesuai dengan preferensi Anda.
        </Text>
      </VStack>
      <Button
        variant="secondary"
        onClick={toggleThemeMode}
        label={buttonLabel}
        icon={buttonIcon}
      />
    </HStack>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: SettingsAppearance,
});
