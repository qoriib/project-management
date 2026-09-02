import { createFileRoute } from "@tanstack/react-router";
import { Button, HStack, Heading, Text, VStack } from "@astryxdesign/core";
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
    <HStack vAlign="center" gap={6}>
      <VStack width="100%" gap={1}>
        <Heading level={3}>Mode Tampilan</Heading>
        <Text type="supporting" color="secondary">
          Ubah skema warna antarmuka aplikasi antara mode terang dan mode gelap.
        </Text>
      </VStack>
      <Button
        variant="secondary"
        onClick={toggleThemeMode}
        label={isDark ? "Ganti ke Terang" : "Ganti ke Gelap"}
        icon={isDark ? <Sun /> : <Moon />}
      />
    </HStack>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: SettingsAppearance,
});
