import { createFileRoute } from '@tanstack/react-router';
import {
  Section, VStack, HStack, Button, Text, Divider, Selector, TextInput
} from "@astryxdesign/core";
import { TabList } from "@astryxdesign/core/TabList";
import { Tab } from "@astryxdesign/core/TabList";
import { PageHeader } from "@/components/shared/PageHeader";
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useState, useEffect } from 'react';
import { projectRepo } from '@/db/repositories/project.repository';
import type { Project } from '@/db/models';
import { SettingsResetDialog } from '@/components/settings/SettingsResetDialog';
import { changePin } from '@/services/auth';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('sync');

  // Sync state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dialog state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Security state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    projectRepo.findAll().then(setProjects).catch(console.error);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);

      const now = new Date();
      // YYYYMMDD_HHMMSS
      const timestamp = now.getFullYear().toString() + '-' +
        (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
        now.getDate().toString().padStart(2, '0') + '_' +
        now.getHours().toString().padStart(2, '0') + '-' +
        now.getMinutes().toString().padStart(2, '0') + '-' +
        now.getSeconds().toString().padStart(2, '0');

      const selectedProject = projects.find(p => p.project_id === selectedProjectId);
      const projName = selectedProject ? selectedProject.project_name.replace(/[^a-zA-Z0-9]/g, '_') : 'FullBackup';

      const targetPath = await save({
        title: 'Simpan Backup Project',
        filters: [{ name: 'Project Data Archive', extensions: ['project'] }],
        defaultPath: `${timestamp}_${projName}.project`,
      });

      if (targetPath) {
        await invoke('export_csv_zip', {
          targetPath,
          projectId: selectedProjectId || null
        });
        setMessage({ text: 'Data berhasil diekspor ke ' + targetPath, type: 'success' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: `Gagal mengekspor data: ${error}`, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setMessage(null);

      const sourcePath = await open({
        title: 'Pilih File Backup Project',
        filters: [{ name: 'Project Data Archive', extensions: ['project'] }],
        multiple: false,
      });

      if (sourcePath && typeof sourcePath === 'string') {
        const confirmImport = window.confirm("PERINGATAN: Mengimpor data akan menggabungkan perubahan. Aplikasi akan memuat ulang. Lanjutkan?");
        if (!confirmImport) return;

        setIsImporting(true);
        await invoke('import_csv_zip', { sourcePath });
        // App will restart automatically via Rust
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: `Gagal mengimpor data: ${error}`, type: 'error' });
      setIsImporting(false);
    }
  };

  const handleOpenResetDialog = () => {
    setIsResetDialogOpen(true);
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      setIsResetDialogOpen(false);
      await invoke('reset_db');
      // App will restart
    } catch (error) {
      console.error(error);
      setMessage({ text: `Gagal mereset data: ${error}`, type: 'error' });
      setIsResetting(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPin !== confirmNewPin) {
      setSecurityMessage({ text: 'Konfirmasi PIN baru tidak cocok.', type: 'error' });
      return;
    }

    try {
      setIsChangingPin(true);
      await changePin(oldPin, newPin);
      setSecurityMessage({ text: 'PIN berhasil diubah!', type: 'success' });
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: any) {
      setSecurityMessage({ text: err.message || 'Gagal mengubah PIN.', type: 'error' });
    } finally {
      setIsChangingPin(false);
    }
  };

  const projectOptions = [
    { value: '', label: 'Semua Proyek (Full Backup)' },
    ...projects.map(p => ({ value: p.project_id, label: p.project_name }))
  ];

  return (
    <>
      <Section padding={6}>
        <VStack style={{ minHeight: 'calc(100vh - 48px)' }}>
          <VStack gap={4} style={{ flex: 1 }}>
            <PageHeader
              title="Pengaturan"
              subtitle="Konfigurasi sistem dan manajemen sinkronisasi data"
            />

            <TabList value={activeTab} onChange={setActiveTab} hasDivider>
              <Tab value="sync" label="Sinkronisasi Data" />
              <Tab value="security" label="Keamanan (PIN)" />
            </TabList>

            <VStack gap={6} style={{ maxWidth: '600px', marginTop: 'var(--spacing-4)' }}>
              {activeTab === 'sync' && (
                <>
                  <VStack gap={2}>
                    <Text size="lg" weight="bold">Sinkronisasi Data</Text>
                    <Text color="secondary">
                      Ekspor data proyek Anda menjadi file `.project` yang aman. File ini dienkripsi dengan standar AES dan dapat saling dibagikan antar anggota tim untuk digabungkan secara otomatis.
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
                      label={isExporting ? 'Mengekspor...' : 'Export ke .project'}
                    />
                    <Button
                      variant="primary"
                      onClick={handleImport}
                      isDisabled={isExporting || isImporting || isResetting}
                      label={isImporting ? 'Mengimpor...' : 'Import dari .project'}
                    />
                  </HStack>

                  <Divider />

                  <VStack gap={2}>
                    <Text size="lg" weight="bold" style={{ color: 'var(--color-danger)' }}>Reset Data</Text>
                    <Text color="secondary">
                      Hapus keseluruhan isi aplikasi dan kembali ke keadaan kosong. Tindakan ini tidak dapat dibatalkan.
                    </Text>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={handleOpenResetDialog}
                        isDisabled={isExporting || isImporting || isResetting}
                        style={{ marginTop: 'var(--spacing-2)' }}
                        label={isResetting ? 'Mereset...' : 'Reset Database'}
                      />
                    </div>
                  </VStack>

                  {message && (
                    <Text
                      style={{ marginTop: 'var(--spacing-2)', color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
                    >
                      {message.text}
                    </Text>
                  )}
                </>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleChangePin}>
                  <VStack gap={5}>
                    <VStack gap={2}>
                      <Text size="lg" weight="bold">Ubah PIN Akses</Text>
                      <Text color="secondary">
                        PIN default adalah 000000. PIN akan disimpan secara terenkripsi menggunakan AES-256-GCM.
                      </Text>
                    </VStack>

                    <VStack gap={4}>
                      <TextInput
                        label="PIN Lama"
                        type="text"
                        placeholder="Masukkan PIN lama"
                        value={oldPin}
                        onChange={(val) => setOldPin((val || '').replace(/\D/g, '').slice(0, 6))}
                        style={{ textAlign: 'center', letterSpacing: '1em', fontSize: '1.75rem', fontWeight: 'bold' }}
                      />
                      <TextInput
                        label="PIN Baru"
                        type="text"
                        placeholder="6 digit PIN baru"
                        value={newPin}
                        onChange={(val) => setNewPin((val || '').replace(/\D/g, '').slice(0, 6))}
                        style={{ textAlign: 'center', letterSpacing: '1em', fontSize: '1.75rem', fontWeight: 'bold' }}
                      />
                      <TextInput
                        label="Konfirmasi PIN Baru"
                        type="text"
                        placeholder="Ketik ulang PIN baru"
                        value={confirmNewPin}
                        onChange={(val) => setConfirmNewPin((val || '').replace(/\D/g, '').slice(0, 6))}
                        style={{ textAlign: 'center', letterSpacing: '1em', fontSize: '1.75rem', fontWeight: 'bold' }}
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
                        style={{ marginTop: 'var(--spacing-2)', color: securityMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
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

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
});
