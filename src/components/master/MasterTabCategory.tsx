import { useEffect, useState } from "react";
import { Card, Button, Table, Dialog, TextInput, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { itemCategoryRepo, itemRepo, type ItemCategory, type Item } from "@/db/repositories";

export function MasterTabCategory() {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = useToast();

  const [categoryName, setCategoryName] = useState("");

  async function loadData() {
    const [nextCategories, nextItems] = await Promise.all([
      itemCategoryRepo.findAllSorted(),
      itemRepo.findAllWithPrices(),
    ]);
    setCategories(nextCategories);
    setItems(nextItems);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setCategoryName("");
    setEditTarget(null);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  function openEdit(category: ItemCategory) {
    setEditTarget(category);
    setCategoryName(category.category_name);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setErrorMsg(null);
    setSaving(true);
    try {
      const data = { category_name: categoryName };
      if (editTarget) {
        await itemCategoryRepo.update(editTarget.category_id, data);
        showToast({ body: "Kategori berhasil diubah", type: "info" });
      } else {
        await itemCategoryRepo.create(data);
        showToast({ body: "Kategori berhasil ditambahkan", type: "info" });
      }
      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan kategori");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await itemCategoryRepo.delete(deleteTarget.id);
      showToast({ body: "Kategori berhasil dihapus", type: "info" });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus kategori", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const categoryRows = categories.map((category) => ({
    ...category,
    count: items.filter((item) => item.category === category.category_name).length,
  }));

  const columns = [
    {
      key: "category_id",
      header: "Kode Kategori",
      width: pixel(180),
      renderCell: (row: ItemCategory) => String(row.category_id).padStart(4, '0')
    },
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
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={categoryRows as any}
          idKey="category_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada kategori.</Text></VStack>}
        />
      </Card>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Kategori" : "Tambah Kategori"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

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
