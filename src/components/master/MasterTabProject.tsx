import { useEffect, useState } from "react";
import { Card, Button, Table, Dialog, TextInput, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getProjects, createProject, updateProject, deleteProject,
  type Project,
} from "@/db/queries/master";

export function MasterTabProject() {
  const [projects, setProjects] = useState<Project[]>([]);

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
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditTarget(project);
    setProjectName(project.project_name);
    setCompanyName(project.company_name);
    setFiscalYear(String(project.fiscal_year));
    setErrorMsg(null);
    setIsDialogOpen(true);
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
      if (editTarget) {
        await updateProject(editTarget.project_id, data);
        showToast({ body: "Project berhasil diubah", type: "info" });
      } else {
        await createProject(data);
        showToast({ body: "Project berhasil ditambahkan", type: "info" });
      }
      setIsDialogOpen(true);
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

          <HStack gap={2} justify="end">
            <Button variant="ghost" label="Batal" onClick={() => setIsDialogOpen(false)} />
            <Button variant="primary" label="Simpan" onClick={handleSave} isLoading={saving} />
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
