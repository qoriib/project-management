import { useEffect, useState } from "react";
import { Card, Button, Table, Badge, Dialog, TextInput, Selector, VStack, HStack, Text, Heading } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getItems, createItem, updateItem, deleteItem,
  getItemCategories, getUnits,
  getItemPrices, saveItemPrices, type ItemPriceWithRelation,
  type Item, type ItemCategory, type Unit, type ItemPrice, type ItemWithPrices,
} from "@/db/queries/master";

export function MasterTabItem() {
  const [items, setItems] = useState<ItemWithPrices[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showToast = useToast();

  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("MATERIAL");
  const [itemUnit, setItemUnit] = useState("m3");

  // Price Management State
  const [prices, setPrices] = useState<Partial<ItemPriceWithRelation>[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);

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

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener('openMasterCreate', handleOpen);
    return () => window.removeEventListener('openMasterCreate', handleOpen);
  }, []);

  function openCreate() {
    setItemName(""); setItemCategory("MATERIAL"); setItemUnit("m3");
    setEditTarget(null);
    setPrices([{ price: 0 }]);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function openEdit(item: Item) {
    setEditTarget(item);
    setItemName(item.item_name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setErrorMsg(null);
    setIsDialogOpen(true);
    
    setLoadingPrices(true);
    try {
      const fetched = await getItemPrices(item.item_id);
      setPrices(fetched.length > 0 ? fetched : [{ price: 0 }]);
    } catch (error) {
      setPrices([{ price: 0 }]);
    } finally {
      setLoadingPrices(false);
    }
  }



  async function handleSave() {
    setErrorMsg(null);
    setSaving(true);
    try {
      const data = { item_name: itemName, category: itemCategory as any, unit: itemUnit };
      let itemId: number;
      if (editTarget) {
        await updateItem(editTarget.item_id, data);
        itemId = editTarget.item_id;
        showToast({ body: "Item dan harga berhasil diubah", type: "info" });
      } else {
        itemId = await createItem(data);
        showToast({ body: "Item dan harga berhasil ditambahkan", type: "info" });
      }
      
      await saveItemPrices(itemId, prices as { price_id?: number, price: number }[]);
      setIsDialogOpen(false);
      setEditTarget(null);
      await loadData();
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
      await loadData();
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
      renderCell: (row: Item) => String(row.item_id).padStart(4, '0')
    },
    { key: "item_name", header: "Nama Item", width: proportional(1.5) },
    { key: "unit", header: "Satuan", width: pixel(100) },
    { 
      key: "prices", header: "Harga (Rp)", width: proportional(1),
      renderCell: (row: ItemWithPrices) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.prices?.length > 0 ? row.prices.map((p, idx) => (
            <Badge key={idx} variant="neutral" label={new Intl.NumberFormat('id-ID').format(p)} />
          )) : "-"}
        </HStack>
      )
    },
    {
      key: "category", header: "Kategori", width: pixel(180),
      renderCell: (row: Item) => <Badge variant="neutral" label={row.category} />,
    },
    {
      key: "actions", header: "", width: pixel(220),
      renderCell: (row: Item) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Edit" onClick={() => openEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })} />
        </HStack>
      ),
    },
  ];

  const categoryOptions = categories.map((category) => ({
    value: category.category_name,
    label: category.category_name,
  }));

  const unitOptions = units.map((unit) => ({
    value: unit.unit_name,
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
          
          <Heading level={4} style={{ marginTop: '1rem' }}>Variasi Harga</Heading>
          {loadingPrices ? (
            <Text color="secondary">Memuat data harga...</Text>
          ) : (
            <VStack gap={3}>
              {prices.map((p, idx) => (
                <HStack key={idx} gap={2} align="end">
                  <NumberInput 
                    label="Harga (Rp)" 
                    value={p.price} 
                    onChange={(val) => {
                      const newPrices = [...prices];
                      newPrices[idx].price = val || 0;
                      setPrices(newPrices);
                    }} 
                    width={180}
                    isDisabled={p.has_relation}
                  />
                  {!p.has_relation && prices.length > 1 && (
                    <Button 
                      variant="destructive" 
                      label="✕" 
                      onClick={() => setPrices(prices.filter((_, i) => i !== idx))} 
                    />
                  )}
                </HStack>
              ))}
              
              <HStack>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  label="+ Tambah Variasi Harga" 
                  onClick={() => setPrices([...prices, { price: 0 }])} 
                />
              </HStack>
            </VStack>
          )}

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="ghost" label="Batal" onClick={() => setIsDialogOpen(false)} />
            <Button variant="primary" label="Simpan" onClick={handleSave} isLoading={saving} isDisabled={loadingPrices} />
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
