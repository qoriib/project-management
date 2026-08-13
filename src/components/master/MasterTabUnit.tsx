import { useEffect, useState } from "react";
import { Button, Table, Dialog, TextInput, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getUnits, createUnit, updateUnit, deleteUnit,
  getItems,
  type Unit, type Item,
} from "@/db/queries/master";

export function MasterTabUnit() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [unitName, setUnitName] = useState("");

  async function loadData() {
    const [nextUnits, nextItems] = await Promise.all([
      getUnits(),
      getItems(),
    ]);
    setUnits(nextUnits);
    setItems(nextItems);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setUnitName("");
    setEditTarget(null);
    setIsDialogOpen(true);
  }

  function openEdit(unit: Unit) {
    setEditTarget(unit);
    setUnitName(unit.unit_name);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { unit_name: unitName };
      if (editTarget) {
        await updateUnit(editTarget.unit_id, data);
      } else {
        await createUnit(data);
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
      await deleteUnit(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const unitRows = units.map((unit) => ({
    ...unit,
    count: items.filter((item) => item.unit === unit.unit_name).length,
  }));

  const columns = [
    { key: "unit_name", header: "Satuan", width: proportional(1) },
    { key: "count", header: "Jumlah Item", width: pixel(140), renderCell: (row: { count: number }) => String(row.count) },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: Unit & { count: number }) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" isDisabled={row.count > 0} onClick={() => setDeleteTarget({ id: row.unit_id, label: row.unit_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <HStack justify="end">
        <Button variant="primary" label="+ Tambah Satuan" onClick={openCreate} />
      </HStack>
      <Table
        columns={columns as any}
        data={unitRows as any}
        idKey="unit_id"
        emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada satuan.</Text></VStack>}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Satuan" : "Tambah Satuan"}</Heading>
          <TextInput label="Nama Satuan" value={unitName} onChange={setUnitName} isRequired />
          
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
