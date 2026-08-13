import { useEffect, useState } from "react";
import { Button, Table, Badge, Dialog, TextInput, Selector, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getProjects, createProject, updateProject, deleteProject,
  type Project,
} from "@/db/queries/master";

type ProjectStatus = Project["status"];

export function MasterTabProject() {
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2026");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("ON_PROGRESS");

  async function loadData() {
    const nextProjects = await getProjects();
    setProjects(nextProjects);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setProjectCode(""); setProjectName(""); setContractorName(""); setFiscalYear("2026"); setProjectStatus("ON_PROGRESS");
    setEditTarget(null);
    setIsDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditTarget(project);
    setProjectCode(project.project_code);
    setProjectName(project.project_name);
    setContractorName(project.contractor_name);
    setFiscalYear(String(project.fiscal_year));
    setProjectStatus(project.status);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        project_code: projectCode,
        project_name: projectName,
        contractor_name: contractorName,
        fiscal_year: Number(fiscalYear),
        status: projectStatus,
      };
      if (editTarget) {
        await updateProject(editTarget.project_id, data);
      } else {
        await createProject(data);
      }
      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "project_code", header: "Kode", width: pixel(120) },
    { key: "project_name", header: "Nama Project", width: proportional(1.3) },
    { key: "contractor_name", header: "Kontraktor", width: proportional(1) },
    { key: "fiscal_year", header: "Tahun", width: pixel(100) },
    {
      key: "status", header: "Status", width: pixel(140),
      renderCell: (row: Project) => <Badge variant={row.status === "COMPLETED" ? "success" : "warning"} label={row.status} />,
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
      <HStack justify="end">
        <Button variant="primary" label="+ Tambah Project" onClick={openCreate} />
      </HStack>
      <Table
        columns={columns as any}
        data={projects as any}
        idKey="project_id"
        emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada project.</Text></VStack>}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Project" : "Tambah Project"}</Heading>
          <TextInput label="Kode Project" value={projectCode} onChange={setProjectCode} isRequired />
          <TextInput label="Nama Project" value={projectName} onChange={setProjectName} isRequired />
          <TextInput label="Kontraktor" value={contractorName} onChange={setContractorName} isRequired />
          <TextInput label="Tahun Fiskal" value={fiscalYear} onChange={setFiscalYear} isRequired />
          <Selector
            label="Status"
            value={projectStatus || ""}
            onChange={(value) => setProjectStatus(value as ProjectStatus)}
            options={[
              { value: "ON_PROGRESS", label: "Berjalan" },
              { value: "COMPLETED", label: "Selesai" },
              { value: "SUSPENDED", label: "Ditunda" },
            ]}
          />
          
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
