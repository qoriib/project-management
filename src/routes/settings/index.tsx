import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Divider,
  HStack,
  Section,
  Selector,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { TabList } from "@astryxdesign/core/TabList";
import { Tab } from "@astryxdesign/core/TabList";
import { PageHeader } from "@/components/shared/PageHeader";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { projectRepo } from "@/db/repositories/project.repository";
import { SettingsResetDialog } from "@/components/settings/SettingsResetDialog";
import { changePin } from "@/db/services/auth.service";
import { useAppStore } from "@/store/useAppStore";
import { useShallow } from "zustand/react/shallow";
import { Moon, Sun } from "lucide-react";
import type { Project } from "@/db/models";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("appearance"),
    // Theme state
    { resolvedMode, toggleThemeMode } = useAppStore(
      useShallow((s) => ({
        resolvedMode: s.resolvedMode,
        toggleThemeMode: s.toggleThemeMode,
      })),
    ),
    // Sync state
    [isExporting, setIsExporting] = useState(false),
    [isImporting, setIsImporting] = useState(false),
    [isResetting, setIsResetting] = useState(false),
    [projects, setProjects] = useState<Project[]>([]),
    [selectedProjectId, setSelectedProjectId] = useState<string>(""),
    [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null),
    // Dialog state
    [isResetDialogOpen, setIsResetDialogOpen] = useState(false),
    // Security state
    [oldPin, setOldPin] = useState(""),
    [newPin, setNewPin] = useState(""),
    [confirmNewPin, setConfirmNewPin] = useState(""),
    [securityMessage, setSecurityMessage] = useState<{
      text: string;
      type: "success" | "error";
    } | null>(null),
    [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    projectRepo.findAll().then(setProjects).catch(console.error);
  }, []);

  const handleExport = async () => {
      try {
        setIsExporting(true);
        setMessage(null);

        const now = new Date(),
          // YYYYMMDD_HHMMSS
          timestamp = `${now.getFullYear().toString()}-${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now
            .getHours()
            .toString()
            .padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now
            .getSeconds()
            .toString()
            .padStart(2, "0")}`;

        const selectedProject = projects.find((p) => p.project_id === selectedProjectId),
          projName = selectedProject
            ? selectedProject.project_name.replaceAll(/[^a-zA-Z0-9]/g, "_")
            : "FullBackup",
          targetPath = await save({
            defaultPath: `${timestamp}_${projName}.project`,
            filters: [{ name: "Project Data Archive", extensions: ["project"] }],
            title: "Simpan Backup Project",
          });

        if (targetPath) {
          await invoke("export_csv_zip", {
            projectId: selectedProjectId || null,
            targetPath,
          });
          setMessage({ text: `Data berhasil diekspor ke ${targetPath}`, type: "success" });
        }
      } catch (error) {
        console.error(error);
        setMessage({ text: `Gagal mengekspor data: ${error}`, type: "error" });
      } finally {
        setIsExporting(false);
      }
    },
    handleImport = async () => {
      try {
        setMessage(null);

        const sourcePath = await open({
          filters: [{ name: "Project Data Archive", extensions: ["project"] }],
          multiple: false,
          title: "Pilih File Backup Project",
        });

        if (sourcePath && typeof sourcePath === "string") {
          const confirmImport = window.confirm(
            "PERINGATAN: Mengimpor data akan menggabungkan perubahan. Aplikasi akan memuat ulang. Lanjutkan?",
          );
          if (!confirmImport) {
            return;
          }

          setIsImporting(true);
          await invoke("import_csv_zip", { sourcePath });
          // App will restart automatically via Rust
        }
      } catch (error) {
        console.error(error);
        setMessage({ text: `Gagal mengimpor data: ${error}`, type: "error" });
        setIsImporting(false);
      }
    },
    handleOpenResetDialog = () => {
      setIsResetDialogOpen(true);
    },
    executeReset = async () => {
      try {
        setIsResetting(true);
        setIsResetDialogOpen(false);
        await invoke("reset_db");
        // App will restart
      } catch (error) {
        console.error(error);
        setMessage({ text: `Gagal mereset data: ${error}`, type: "error" });
        setIsResetting(false);
      }
    },
    handleChangePin = async (e: React.FormEvent) => {
      e.preventDefault();
      setSecurityMessage(null);

      if (newPin !== confirmNewPin) {
        setSecurityMessage({ text: "Konfirmasi PIN baru tidak cocok.", type: "error" });
        return;
      }

      try {
        setIsChangingPin(true);
        await changePin(oldPin, newPin);
        setSecurityMessage({ text: "PIN berhasil diubah!", type: "success" });
        setOldPin("");
        setNewPin("");
        setConfirmNewPin("");
      } catch (error: any) {
        setSecurityMessage({ text: error.message || "Gagal mengubah PIN.", type: "error" });
      } finally {
        setIsChangingPin(false);
      }
    },
    projectOptions = [
      { label: "Semua Proyek (Full Backup)", value: "" },
      ...projects.map((p) => ({ label: p.project_name, value: p.project_id })),
    ];

  return (
    <>
      <Section padding={6}>
        <VStack style={{ minHeight: "calc(100vh - 48px)" }}>
          <VStack gap={4} style={{ flex: 1 }}>
            <PageHeader
              title="Pengaturan"
              subtitle="Konfigurasi sistem dan manajemen sinkronisasi data"
            />

            <TabList value={activeTab} onChange={setActiveTab} hasDivider>
              <Tab value="appearance" label="Tampilan" />
              <Tab value="sync" label="Sinkronisasi Data" />
              <Tab value="security" label="Keamanan (PIN)" />
            </TabList>

            <VStack gap={6} style={{ marginTop: "var(--spacing-4)", maxWidth: "600px" }}>
              {activeTab === "appearance" && (
                <VStack gap={4}>
                  <VStack gap={2}>
                    <Text size="lg" weight="bold">
                      Tampilan Aplikasi
                    </Text>
                    <Text color="secondary">
                      Sesuaikan tema warna aplikasi sesuai dengan preferensi Anda.
                    </Text>
                  </VStack>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={toggleThemeMode}
                      label={
                        resolvedMode === "dark" ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"
                      }
                      icon={resolvedMode === "dark" ? <Sun size="1em" /> : <Moon size="1em" />}
                    />
                  </div>
                </VStack>
              )}

              {activeTab === "sync" && (
                <>
                  <VStack gap={2}>
                    <Text size="lg" weight="bold">
                      Sinkronisasi Data
                    </Text>
                    <Text color="secondary">
                      Ekspor data proyek Anda menjadi file `.project` yang aman. File ini dienkripsi
                      dengan standar AES dan dapat saling dibagikan antar anggota tim untuk
                      digabungkan secara otomatis.
                    </Text>
                  </VStack>

                  <VStack gap={1}>
                    <Selector
                      label="Filter Export Proyek"
                      placeholder="Pilih proyek..."
                      value={selectedProjectId}
                      onChange={(v) => setSelectedProjectId(v)}
                      options={projectOptions}
                    />
                  </VStack>

                  <HStack gap={4}>
                    <Button
                      variant="secondary"
                      onClick={handleExport}
                      isDisabled={isExporting || isImporting || isResetting}
                      label={isExporting ? "Mengekspor..." : "Export ke .project"}
                    />
                    <Button
                      variant="primary"
                      onClick={handleImport}
                      isDisabled={isExporting || isImporting || isResetting}
                      label={isImporting ? "Mengimpor..." : "Import dari .project"}
                    />
                  </HStack>

                  <Divider />

                  <VStack gap={2}>
                    <Text size="lg" weight="bold" style={{ color: "var(--color-danger)" }}>
                      Reset Data
                    </Text>
                    <Text color="secondary">
                      Hapus keseluruhan isi aplikasi dan kembali ke keadaan kosong. Tindakan ini
                      tidak dapat dibatalkan.
                    </Text>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={handleOpenResetDialog}
                        isDisabled={isExporting || isImporting || isResetting}
                        style={{ marginTop: "var(--spacing-2)" }}
                        label={isResetting ? "Mereset..." : "Reset Database"}
                      />
                    </div>
                  </VStack>

                  {message && (
                    <Text
                      style={{
                        color:
                          message.type === "success"
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                        marginTop: "var(--spacing-2)",
                      }}
                    >
                      {message.text}
                    </Text>
                  )}
                </>
              )}

              {activeTab === "security" && (
                <form onSubmit={handleChangePin}>
                  <VStack gap={5}>
                    <VStack gap={2}>
                      <Text size="lg" weight="bold">
                        Ubah PIN Akses
                      </Text>
                      <Text color="secondary">
                        PIN default adalah 000000. PIN akan disimpan secara terenkripsi menggunakan
                        AES-256-GCM.
                      </Text>
                    </VStack>

                    <VStack gap={4}>
                      <TextInput
                        label="PIN Lama"
                        type="text"
                        placeholder="Masukkan PIN lama"
                        value={oldPin}
                        onChange={(val) => setOldPin((val || "").replaceAll(/\D/g, "").slice(0, 6))}
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "bold",
                          letterSpacing: "1em",
                          textAlign: "center",
                        }}
                      />
                      <TextInput
                        label="PIN Baru"
                        type="text"
                        placeholder="6 digit PIN baru"
                        value={newPin}
                        onChange={(val) => setNewPin((val || "").replaceAll(/\D/g, "").slice(0, 6))}
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "bold",
                          letterSpacing: "1em",
                          textAlign: "center",
                        }}
                      />
                      <TextInput
                        label="Konfirmasi PIN Baru"
                        type="text"
                        placeholder="Ketik ulang PIN baru"
                        value={confirmNewPin}
                        onChange={(val) =>
                          setConfirmNewPin((val || "").replaceAll(/\D/g, "").slice(0, 6))
                        }
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "bold",
                          letterSpacing: "1em",
                          textAlign: "center",
                        }}
                      />
                    </VStack>

                    <div>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isChangingPin}
                        isDisabled={!oldPin || newPin.length !== 6 || confirmNewPin.length !== 6}
                        label="Simpan PIN Baru"
                      />
                    </div>

                    {securityMessage && (
                      <Text
                        style={{
                          color:
                            securityMessage.type === "success"
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                          marginTop: "var(--spacing-2)",
                        }}
                      >
                        {securityMessage.text}
                      </Text>
                    )}
                  </VStack>
                </form>
              )}
            </VStack>
          </VStack>
        </VStack>
      </Section>

      <SettingsResetDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={executeReset}
        isLoading={isResetting}
      />
    </>
  );
}

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});
