import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Section, VStack, HStack, Button, TextInput, Selector, TextArea, Card, Heading, Text, StatusDot,
} from "@astryxdesign/core";
import { PageHeader } from "../../components/PageHeader";
import { getPurchaseOrders, getPOItems, type PurchaseOrder, type POItem } from "../../db/queries/po";
import { createDelivery } from "../../db/queries/field";
import { todayISO, formatNumber } from "../../utils/formatters";

export default function DeliveryFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPoId = searchParams.get("po");

  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [selectedPoItemId, setSelectedPoItemId] = useState("");

  // Delivery fields
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [deliveredVolume, setDeliveredVolume] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [locationDestination, setLocationDestination] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPOs() {
      const p = await getPurchaseOrders();
      setPOs(p);
      if (initialPoId) {
        setSelectedPoId(initialPoId);
      }
    }
    loadPOs();
  }, [initialPoId]);

  useEffect(() => {
    if (!selectedPoId) {
      setPOItems([]);
      setSelectedPoItemId("");
      return;
    }
    async function loadItems() {
      const items = await getPOItems(Number(selectedPoId));
      setPOItems(items);
      if (items.length > 0) {
        setSelectedPoItemId(String(items[0].po_item_id));
      }
    }
    loadItems();
  }, [selectedPoId]);

  const activeItem = poItems.find((i) => i.po_item_id === Number(selectedPoItemId));
  const sisaVolume = activeItem ? activeItem.sisa ?? 0 : 0;
  const inputVol = parseFloat(deliveredVolume) || 0;
  const isOverlimit = inputVol > sisaVolume;

  async function handleSave() {
    if (!selectedPoItemId || !deliveryDate || !deliveredVolume) return;
    setSaving(true);
    try {
      await createDelivery({
        po_item_id: Number(selectedPoItemId),
        delivery_date: deliveryDate,
        delivered_volume: inputVol,
        delivery_note_number: deliveryNoteNumber,
        location_destination: locationDestination,
        notes,
      });
      navigate(selectedPoId ? `/po/${selectedPoId}` : "/delivery/history");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Input Penerimaan Material (Surat Jalan)"
          subtitle="Catat realisasi pengiriman barang/jasa sewa dari PO"
          actions={<Button variant="ghost" label="← Kembali" onClick={() => navigate(-1)} />}
        />

        <Card padding={4}>
          <VStack gap={4}>
            <Heading level={3}>Hubungkan dengan Purchase Order (PO)</Heading>
            <HStack gap={3}>
              <Selector
                label="Pilih PO"
                value={selectedPoId}
                onChange={setSelectedPoId}
                isRequired
                options={[
                  { value: "", label: "Pilih nomor PO..." },
                  ...pos.map((p) => ({ value: String(p.po_id), label: `${p.po_number} (${p.vendor_name})` })),
                ]}
                width={320}
              />

              {selectedPoId && (
                <Selector
                  label="Pilih Item PO"
                  value={selectedPoItemId}
                  onChange={setSelectedPoItemId}
                  isRequired
                  options={poItems.map((i) => ({
                    value: String(i.po_item_id),
                    label: `${i.item_name} (Sisa: ${formatNumber(i.sisa, 2)} ${i.unit})`,
                  }))}
                  width={320}
                />
              )}
            </HStack>

            {activeItem && (
              <Card padding={3} style={{ borderLeft: "4px solid var(--color-accent-500)" }}>
                <VStack gap={1}>
                  <Text size="2xs" color="secondary">Detail Item PO</Text>
                  <Text size="sm"><strong>{activeItem.item_name}</strong></Text>
                  <Text size="2xs" color="secondary">
                    Volume Kontrak PO: {formatNumber(activeItem.ordered_volume, 2)} {activeItem.unit} |
                    Terkirim: {formatNumber(activeItem.total_terkirim, 2)} {activeItem.unit} |
                    Sisa Kontrak: {formatNumber(sisaVolume, 2)} {activeItem.unit}
                  </Text>
                </VStack>
              </Card>
            )}
          </VStack>
        </Card>

        {selectedPoItemId && (
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={3}>Informasi Surat Jalan / Realisasi</Heading>

              <HStack gap={3}>
                <TextInput
                  label="Tanggal Kirim / Terima"
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  isRequired
                  width={180}
                />
                <TextInput
                  label={`Volume Kirim (${activeItem?.unit ?? ""})`}
                  value={deliveredVolume}
                  onChange={setDeliveredVolume}
                  isRequired
                  width={180}
                  status={isOverlimit ? { type: "warning", message: "Melebihi sisa kontrak PO!" } : undefined}
                />
                {activeItem && (
                  <HStack gap={2} align="center" style={{ alignSelf: "end", height: "40px" }}>
                    <StatusDot variant={isOverlimit ? "warning" : "success"} label={isOverlimit ? "Overlimit" : "Within limit"} />
                    <Text size="2xs" color="secondary">
                      {isOverlimit ? "Volume melebihi sisa PO" : "Volume dalam batas PO"}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <HStack gap={3}>
                <TextInput
                  label="Nomor Surat Jalan"
                  value={deliveryNoteNumber}
                  onChange={setDeliveryNoteNumber}
                  width={240}
                  placeholder="Contoh: SJ-00892"
                />
                <TextInput
                  label="Lokasi Tujuan / Dump Site"
                  value={locationDestination}
                  onChange={setLocationDestination}
                  width={320}
                  placeholder="Contoh: Sulusuban STA 12+400"
                />
              </HStack>

              <TextArea
                label="Keterangan Ritase / Plat Mobil"
                value={notes}
                onChange={setNotes}
                placeholder="Masukkan plat truk, nama driver, atau catatan kondisi barang saat diterima..."
              />
            </VStack>
          </Card>
        )}

        <HStack gap={2} justify="end">
          <Button variant="ghost" label="Batal" onClick={() => navigate(-1)} />
          <Button
            variant="primary"
            label="Simpan Pengiriman"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={!selectedPoItemId || !deliveryDate || !deliveredVolume}
          />
        </HStack>
      </VStack>
    </Section>
  );
}
