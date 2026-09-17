import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, HStack, Heading, Selector, Text, TextArea, TextInput, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { generateAssetRequestPdf, generatePurchaseOrderPdf } from "@/db/services/pdf";
import type { OrderPdfTemplate } from "@/db/services/pdf";
import type { OrderItemDetail, OrderWithSummary } from "@/db/repositories";

interface OrderDownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithSummary;
  items: OrderItemDetail[];
}

export function OrderDownloadDialog({ isOpen, onClose, order, items }: OrderDownloadDialogProps) {
  const showToast = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<OrderPdfTemplate>("purchase-order");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [orderCodeInput, setOrderCodeInput] = useState<string>(order.order_code ?? "");
  const [noteInput, setNoteInput] = useState<string>("");
  const [documentCodeInput, setDocumentCodeInput] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTemplate("purchase-order");
    setSelectedVendorId("");
    setOrderCodeInput(order.order_code ?? "");
    setNoteInput("");
    setDocumentCodeInput("");
    setRemarksInput("");
  }, [isOpen, order.order_code, order.order_id]);

  // Daftar vendor unik dari item order (satu dokumen PO = satu vendor)
  const vendorOptions = useMemo(() => {
    const vendorMap = new Map<string, string>();
    for (const item of items) {
      if (item.vendor_id && !vendorMap.has(item.vendor_id)) {
        vendorMap.set(item.vendor_id, item.vendor_name ?? item.vendor_id);
      }
    }
    return Array.from(vendorMap.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  const isPurchaseOrder = selectedTemplate === "purchase-order";
  const canDownload = isPurchaseOrder ? Boolean(selectedVendorId) : true;

  const handleDownload = async () => {
    if (!canDownload) return;

    try {
      setIsDownloading(true);
      const timestamp = getTimestampString();
      const projectName = sanitizeFilename(order.project_name ?? "Proyek");
      const baseFilename = `${timestamp}_${projectName}`;
      const selectedVendor = vendorOptions.find((vendor) => vendor.value === selectedVendorId);
      const vendorName = sanitizeFilename(selectedVendor?.label ?? "Vendor");
      const filename = isPurchaseOrder ? `${baseFilename}_PO_${vendorName}.pdf` : `${baseFilename}_Form_Permintaan.pdf`;

      const filePath = await save({
        filters: [{ name: "PDF Document", extensions: ["pdf"] }],
        defaultPath: filename,
        title: isPurchaseOrder ? "Simpan Purchase Order" : "Simpan Form Permintaan Barang/Alat",
      });

      if (filePath) {
        const buffer = isPurchaseOrder
          ? await generatePurchaseOrderPdf(order.order_id, {
              vendorId: selectedVendorId,
              orderCodeOverride: orderCodeInput.trim() || undefined,
              note: noteInput.trim() || undefined,
            })
          : await generateAssetRequestPdf(order.order_id, {
              documentCode: documentCodeInput.trim() || undefined,
              remarks: remarksInput.trim() || undefined,
            });

        await writeFile(filePath, buffer);
        showToast({ body: "Dokumen PDF berhasil diunduh!", type: "info" });
        onClose();
      }
    } catch (err) {
      console.error("Download order PDF failed:", err);
      showToast({ body: "Gagal mengunduh dokumen PDF.", type: "error" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      purpose="form"
      onOpenChange={(open) => {
        if (!open && !isDownloading) {
          onClose();
        }
      }}
      width={480}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleDownload();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>Unduh Dokumen PDF</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <VStack gap={4}>
                <Selector
                  label="Template Dokumen"
                  value={selectedTemplate}
                  onChange={(value) => setSelectedTemplate(value as OrderPdfTemplate)}
                  options={[
                    { value: "purchase-order", label: "Purchase Order" },
                    { value: "asset-request", label: "Form Permintaan" },
                  ]}
                />
                {isPurchaseOrder ? (
                  <VStack gap={4} width="100%">
                    <Selector
                      label="Vendor Tujuan"
                      options={vendorOptions}
                      value={selectedVendorId}
                      onChange={(value) => setSelectedVendorId(value)}
                      placeholder="Pilih vendor..."
                      isDisabled={vendorOptions.length === 0}
                      isRequired
                    />
                    <TextInput
                      label="No. PO"
                      value={orderCodeInput}
                      onChange={setOrderCodeInput}
                      placeholder={`Default: ${order.order_code ?? "-"}`}
                    />
                    <TextArea
                      label="Keterangan (opsional)"
                      value={noteInput}
                      onChange={setNoteInput}
                      placeholder="Masukkan keterangan daftar barang..."
                      rows={3}
                    />
                  </VStack>
                ) : (
                  <VStack gap={4} width="100%">
                    <TextInput
                      label="No. Dokumen"
                      value={documentCodeInput}
                      onChange={setDocumentCodeInput}
                      placeholder="Masukkan nomor dokumen..."
                    />
                    <TextArea
                      label="Keterangan (opsional)"
                      value={remarksInput}
                      onChange={setRemarksInput}
                      placeholder="Masukkan keterangan daftar barang..."
                      rows={3}
                    />
                  </VStack>
                )}

                {vendorOptions.length === 0 && isPurchaseOrder ? (
                  <Text size="sm" color="secondary">
                    Pengadaan ini belum memiliki item/vendor.
                  </Text>
                ) : null}
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <HStack gap={2} justify="end" width="100%">
                <Button variant="secondary" type="button" onClick={onClose} isDisabled={isDownloading} label="Batal" />
                <Button
                  variant="primary"
                  type="submit"
                  isDisabled={isDownloading || !canDownload}
                  isLoading={isDownloading}
                  label="Unduh PDF"
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
