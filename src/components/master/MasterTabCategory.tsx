import { useEffect, useState } from "react";
import { Button, Table, Dialog, TextInput, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getItemCategories, createItemCategory, updateItemCategory, deleteItemCategory,
  getItems,
  type ItemCategory, type Item,
} from "@/db/queries/master";

export function MasterTabCategory() {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

  async function loadData() {
    const [nextCategories, nextItems] = await Promise.all([
      getItemCategories(),
      getItems(),
    ]);
    setCategories(nextCategories);
    setItems(nextItems);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setCategoryCode(""); setCategoryName("");
    setEditTarget(null);
    setIsDialogOpen(true);
  }

  function openEdit(category: ItemCategory) {
    setEditTarget(category);
    setCategoryCode(category.category_code);
    setCategoryName(category.category_name);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { category_code: categoryCode, category_name: categoryName };
      if (editTarget) {
        await updateItemCategory(editTarget.category_id, data);
      } else {
        await createItemCategory(data);
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
      await deleteItemCategory(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const categoryRows = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.category === category.category_code).length,
  }));

  const columns = [
    { key: "category_code", header: "Kode Kategori", width: pixel(180) },
    { key: "category_name", header: "Nama Kategori", width: proportional(1) },
    { key: "count", header: "Jumlah Item", width: pixel(140), renderCell: (row: { count: number }) => String(row.count) },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: ItemCategory & { count: number }) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" isDisabled={row.count > 0} onClick={() => setDeleteTarget({ id: row.category_id, label: row.category_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <HStack justify="end">
        <Button variant="primary" label="+ Tambah Kategori" onClick={openCreate} />
      </HStack>
      <Table
        columns={columns as any}
        data={categoryRows as any}
        idKey="category_id"
        emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada kategori.</Text></VStack>}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Kategori" : "Tambah Kategori"}</Heading>
          <TextInput label="Kode Kategori" value={categoryCode} onChange={setCategoryCode} isRequired />
          <TextInput label="Nama Kategori" value={categoryName} onChange={setCategoryName} isRequired />
          
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
