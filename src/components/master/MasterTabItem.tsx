import { useEffect, useState } from "react";
import { Card, Button, Table, Badge, Dialog, TextInput, Selector, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { ItemWithDetails } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";

export function MasterTabItem() {
  const { items, categories, units, createItem, updateItem, deleteItem } = useMasterStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = useToast();

  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<string>("");
  const [itemUnit, setItemUnit] = useState<string>("");

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setItemName("");
    setItemCategory(categories.length > 0 ? String(categories[0].category_id) : "");
    setItemUnit(units.length > 0 ? String(units[0].unit_id) : "");
    setEditTarget(null);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function openEdit(item: ItemWithDetails) {
    setEditTarget(item);
    setItemName(item.item_name);
    setItemCategory(String(item.category_id));
    setItemUnit(String(item.unit_id));
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setErrorMsg(null);
    setSaving(true);
    try {
      const data = {
        item_name: itemName,
        category_id: parseInt(itemCategory),
        unit_id: parseInt(itemUnit)
      };
      if (editTarget) {
        await updateItem(editTarget.item_id, data);
        showToast({ body: "Item dan harga berhasil diubah", type: "info" });
      } else {
        await createItem(data);
        showToast({ body: "Item dan harga berhasil ditambahkan", type: "info" });
      }

      setIsDialogOpen(false);
      setEditTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteItem(deleteTarget.id);
      showToast({ body: "Item berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus item", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "item_id",
      header: "Kode",
      width: pixel(120),
      renderCell: (row: ItemWithDetails) => String(row.item_id).padStart(4, '0')
    },
    { key: "item_name", header: "Nama Item", width: proportional(1.5) },
    { key: "unit", header: "Satuan", width: pixel(100), renderCell: (row: ItemWithDetails) => row.unit_name },
    {
      key: "category", header: "Kategori", width: pixel(180),
      renderCell: (row: ItemWithDetails) => <Badge variant="neutral" label={row.category_name || "—"} />,
    },
    {
      key: "actions", header: "", width: pixel(220),
      renderCell: (row: ItemWithDetails) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })} />
        </HStack>
      ),
    },
  ];

  const categoryOptions = categories.map((category) => ({
    value: String(category.category_id),
    label: category.category_name,
  }));

  const unitOptions = units.map((unit) => ({
    value: String(unit.unit_id),
    label: unit.unit_name,
  }));

  return (
    <VStack gap={4}>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={items as any}
          idKey="item_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada item.</Text></VStack>}
        />
      </Card>

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Item" : "Tambah Item"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

          <TextInput label="Nama Item" value={itemName} onChange={setItemName} isRequired />
          <Selector label="Kategori" value={itemCategory} onChange={setItemCategory} options={categoryOptions} />
          <Selector label="Satuan" value={itemUnit} onChange={setItemUnit} options={unitOptions} />

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
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
