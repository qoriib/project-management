import { useEffect, useState } from "react";
import { Card, Button, Table, Dialog, TextInput, VStack, HStack, Text, Heading, Badge } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getProjects, createProject, updateProject, deleteProject, saveProjectStages,
  getProjectStagesWithRelation,
  type Project, type ProjectWithStages
} from "@/db/queries/master";

export function MasterTabProject() {
  const [projects, setProjects] = useState<ProjectWithStages[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = useToast();

  const [projectName, setProjectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2026");

  // Stages Management State
  const [stages, setStages] = useState<{ stage_id?: number, stage_name: string, has_relation?: boolean }[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  async function loadData() {
    const nextProjects = await getProjects();
    setProjects(nextProjects);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setProjectName(""); setCompanyName(""); setFiscalYear("2026");
    setEditTarget(null);
    setStages([{ stage_name: "" }]);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function openEdit(project: Project) {
    setEditTarget(project);
    setProjectName(project.project_name);
    setCompanyName(project.company_name);
    setFiscalYear(String(project.fiscal_year));
    setErrorMsg(null);
    setIsDialogOpen(true);

    setLoadingStages(true);
    try {
      const fetched = await getProjectStagesWithRelation(project.project_id);
      setStages(fetched.length > 0 ? fetched : [{ stage_name: "" }]);
    } catch (error) {
      setStages([{ stage_name: "" }]);
    } finally {
      setLoadingStages(false);
    }
  }

  async function handleSave() {
    setErrorMsg(null);
    setSaving(true);
    try {
      const data = {
        project_name: projectName,
        company_name: companyName,
        fiscal_year: Number(fiscalYear),
      };
      let projectId: number;
      if (editTarget) {
        await updateProject(editTarget.project_id, data);
        projectId = editTarget.project_id;
        showToast({ body: "Project berhasil diubah", type: "info" });
      } else {
        projectId = await createProject(data);
        showToast({ body: "Project berhasil ditambahkan", type: "info" });
      }
      
      const validStages = stages.filter(s => s.stage_name.trim() !== "");
      if (validStages.length > 0) {
        await saveProjectStages(projectId, validStages);
      }

      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      showToast({ body: "Project berhasil dihapus", type: "info" });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus project", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "project_id",
      header: "Kode",
      width: pixel(120),
      renderCell: (row: Project) => String(row.project_id).padStart(4, '0')
    },
    { key: "project_name", header: "Nama Project", width: proportional(1.3) },
    { key: "company_name", header: "Nama Perusahaan", width: proportional(1) },
    { key: "fiscal_year", header: "Tahun", width: pixel(100) },
    {
      key: "stages", header: "Tahapan", width: proportional(1.5),
      renderCell: (row: ProjectWithStages) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.stages?.length > 0 ? row.stages.map((s, idx) => (
            <Badge key={idx} variant="neutral" label={s} />
          )) : "-"}
        </HStack>
      )
    },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: Project) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.project_id, label: row.project_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={projects as any}
          idKey="project_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada project.</Text></VStack>}
        />
      </Card>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={600}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Project" : "Tambah Project"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

          <TextInput label="Nama Project" value={projectName} onChange={setProjectName} isRequired />
          <TextInput label="Nama Perusahaan" value={companyName} onChange={setCompanyName} isRequired />
          <TextInput label="Tahun Fiskal" value={fiscalYear} onChange={setFiscalYear} isRequired />

          <Heading level={4} style={{ marginTop: '1rem' }}>Tahapan Proyek</Heading>
          {loadingStages ? (
            <Text color="secondary">Memuat data tahap...</Text>
          ) : (
            <VStack gap={3}>
              {stages.map((s, idx) => (
                <HStack key={idx} gap={2} align="end">
                  <TextInput 
                    label={`Nama Tahap ${idx + 1}`} 
                    value={s.stage_name} 
                    onChange={(val) => {
                      const newStages = [...stages];
                      newStages[idx].stage_name = val;
                      setStages(newStages);
                    }} 
                    style={{ flex: 1 }}
                  />
                  {!s.has_relation && stages.length > 1 && (
                    <Button 
                      variant="destructive" 
                      label="✕" 
                      onClick={() => setStages(stages.filter((_, i) => i !== idx))} 
                    />
                  )}
                </HStack>
              ))}
              
              <HStack>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  label="+ Tambah Tahap" 
                  onClick={() => setStages([...stages, { stage_name: "" }])} 
                />
              </HStack>
            </VStack>
          )}

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="ghost" label="Batal" onClick={() => setIsDialogOpen(false)} />
            <Button variant="primary" label="Simpan" onClick={handleSave} isLoading={saving} isDisabled={loadingStages} />
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </VStack>
  );
}
