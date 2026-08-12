import { useEffect, useState } from "react";
import {
  Section, VStack, HStack, Button, Table, Badge, Dialog,
  TextInput, Selector, TextArea, SegmentedControl, SegmentedControlItem, Text,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { PageHeader } from "../../components/PageHeader";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  getItems, createItem, updateItem, deleteItem,
  type Item,
} from "../../db/queries/master";
import { KATEGORI_LABELS, KATEGORI_OPTIONS, SATUAN_OPTIONS } from "../../utils/formatters";

export default function CatalogPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [mCode, setMCode] = useState("");
  const [mName, setMName] = useState("");
  const [mUnit, setMUnit] = useState("m3");
  const [mCategory, setMCategory] = useState<"MATERIAL" | "ALAT" | "BETON" | "SOLAR" | "ATK/K3">("MATERIAL");

  async function loadItems() {
    setItems(await getItems());
  }

  useEffect(() => { loadItems(); }, []);

  function openCreate() {
    setEditItem(null);
    setMCode(""); setMName(""); setMUnit("m3"); setMCategory("MATERIAL");
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditItem(item);
    setMCode(item.item_code ?? ""); setMName(item.item_name);
    setMUnit(item.unit); setMCategory(item.category);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editItem) {
        await updateItem(editItem.item_id, { item_code: mCode, item_name: mName, unit: mUnit, category: mCategory });
      } else {
        await createItem({ item_code: mCode, item_name: mName, unit: mUnit, category: mCategory });
      }
      setModalOpen(false);
      await loadItems();
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
      await loadItems();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = filter === "all" ? items : items.filter((m) => m.category === filter);

  const columns = [
    { key: "item_code", header: "Kode Barang", width: pixel(120) },
    { key: "item_name", header: "Nama Barang / Alat", width: proportional(1.5) },
    { key: "unit", header: "Satuan", width: pixel(80) },
    {
      key: "category", header: "Kategori", width: pixel(160),
      renderCell: (v: string) => <Badge variant="neutral">{KATEGORI_LABELS[v] ?? v}</Badge>,
    },
    {
      key: "actions", header: "", width: pixel(140),
      renderCell: (_: unknown, row: Item) => (
        <HStack gap={1}>
          <Button size="sm" variant="tertiary" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant="tertiary" sentiment="negative" onClick={() => setDeleteTarget({ id: row.item_id, label: row.item_name })}>Hapus</Button>
        </HStack>
      ),
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Katalog Material & Alat"
          subtitle="Katalog master barang, sewa alat berat, beton, solar, ATK/K3"
          actions={<Button variant="primary" onClick={openCreate}>+ Tambah Katalog</Button>}
        />

        <SegmentedControl
          value={filter}
          onChange={setFilter}
          label="Filter Kategori"
        >
          <SegmentedControlItem value="all">Semua</SegmentedControlItem>
          {KATEGORI_OPTIONS.map((opt) => (
            <SegmentedControlItem key={opt.value} value={opt.value}>
              {opt.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>

        <Table
          columns={columns as any}
          data={filtered as any}
          rowKey="item_id"
          emptyState={
            <VStack align="center" padding={8}>
              <Text color="secondary">Tidak ada barang untuk kategori ini.</Text>
            </VStack>
          }
        />
      </VStack>

      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Edit Katalog Barang" : "Tambah Katalog Barang"}
        width={440}
      >
        <VStack gap={3}>
          <TextInput label="Kode Barang (opsional)" value={mCode} onChange={setMCode} />
          <TextInput label="Nama Barang / Alat" value={mName} onChange={setMName} isRequired />
          <Selector
            label="Satuan"
            value={mUnit}
            onChange={setMUnit}
            options={SATUAN_OPTIONS.map((s) => ({ value: s, label: s }))}
          />
          <Selector
            label="Kategori"
            value={mCategory}
            onChange={(v) => setMCategory(v as any)}
            options={KATEGORI_OPTIONS}
          />
          <HStack gap={2} justify="end">
            <Button variant="tertiary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>Simpan</Button>
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Katalog"
        message={`Hapus katalog "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
    </Section>
  );
}
