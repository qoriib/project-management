import { useEffect, useState } from "react";
import { Button, Table, Badge, Dialog, TextInput, Selector, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getItems, createItem, updateItem, deleteItem,
  getItemCategories, getUnits,
  type Item, type ItemCategory, type Unit,
} from "@/db/queries/master";

export function MasterTabItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("MATERIAL");
  const [itemUnit, setItemUnit] = useState("m3");

  async function loadData() {
    const [nextItems, nextCategories, nextUnits] = await Promise.all([
      getItems(),
      getItemCategories(),
      getUnits(),
    ]);
    setItems(nextItems);
    setCategories(nextCategories);
    setUnits(nextUnits);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setItemCode(""); setItemName(""); setItemCategory("MATERIAL"); setItemUnit("m3");
    setEditTarget(null);
    setIsDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditTarget(item);
    setItemCode(item.item_code ?? "");
    setItemName(item.item_name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setIsDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = { item_code: itemCode || null, item_name: itemName, category: itemCategory as any, unit: itemUnit };
      if (editTarget) {
        await updateItem(editTarget.item_id, data);
      } else {
        await createItem(data);
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
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "item_code", header: "Kode", width: pixel(120) },
    { key: "item_name", header: "Nama Item", width: proportional(1.5) },
    { key: "unit", header: "Satuan", width: pixel(100) },
    {
      key: "category", header: "Kategori", width: pixel(180),
      renderCell: (row: Item) => <Badge variant="neutral" label={categories.find((category) => category.category_code === row.category)?.category_name ?? row.category} />,
    },
    {
      key: "actions", header: "", width: pixel(150),
      renderCell: (row: Item) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })} />
        </HStack>
      ),
    },
  ];

  const categoryOptions = categories.map((category) => ({
    value: category.category_code,
    label: category.category_name,
  }));

  const unitOptions = units.map((unit) => ({
    value: unit.unit_name,
    label: unit.unit_name,
  }));

  return (
    <VStack gap={4}>
      <HStack justify="end">
        <Button variant="primary" label="+ Tambah Item" onClick={openCreate} />
      </HStack>
      <Table
        columns={columns as any}
        data={items as any}
        idKey="item_id"
        emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada item.</Text></VStack>}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={520}>
        <VStack gap={3}>
          <Heading level={3}>{editTarget ? "Edit Item" : "Tambah Item"}</Heading>
          <TextInput label="Kode Item (opsional)" value={itemCode} onChange={setItemCode} />
          <TextInput label="Nama Item" value={itemName} onChange={setItemName} isRequired />
          <Selector label="Kategori" value={itemCategory} onChange={setItemCategory} options={categoryOptions} />
          <Selector label="Satuan" value={itemUnit} onChange={setItemUnit} options={unitOptions} />
          
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
