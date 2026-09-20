import { useEffect, useMemo, useState } from "react";
import { Button, Dialog, FormLayout, HStack, Heading, Selector, Text, TextArea } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { useToast } from "@astryxdesign/core/Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { generateAssetRequestExcel, generatePurchaseOrderExcel } from "@/db/services/excel";
import { generateAssetRequestPdf, generatePurchaseOrderPdf } from "@/db/services/pdf";
import type { OrderPdfTemplate } from "@/db/services/pdf";
import type { OrderItemDetail, OrderWithSummary } from "@/db/repositories";

interface OrderDownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithSummary;
  items: OrderItemDetail[];
}

const TEMPLATE_OPTIONS = [
  { value: "purchase-order", label: "Purchase Order" },
  { value: "asset-request", label: "Form Permintaan Barang/Alat" },
];

export function OrderDownloadDialog({ isOpen, onClose, order, items }: OrderDownloadDialogProps) {
  const showToast = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState<OrderPdfTemplate>("purchase-order");
  const [downloadFormat, setDownloadFormat] = useState<"xlsx" | "pdf">("xlsx");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTemplate("purchase-order");
    setDownloadFormat("xlsx");
    setSelectedVendorId("");
    setNoteInput("");
    setRemarksInput("");
  }, [isOpen]);

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
      const ext = downloadFormat;
      const filename = isPurchaseOrder
        ? `${baseFilename}_PO_${vendorName}.${ext}`
        : `${baseFilename}_Form_Permintaan.${ext}`;

      const filePath = await save({
        filters:
          downloadFormat === "xlsx"
            ? [{ name: "Excel Spreadsheet", extensions: ["xlsx"] }]
            : [{ name: "PDF Document", extensions: ["pdf"] }],
        defaultPath: filename,
        title: isPurchaseOrder ? `Simpan Purchase Order (.${ext})` : `Simpan Form Permintaan Barang/Alat (.${ext})`,
      });

      if (filePath) {
        let buffer: Uint8Array;
        if (isPurchaseOrder) {
          if (downloadFormat === "xlsx") {
            buffer = await generatePurchaseOrderExcel(order.order_id, {
              vendorId: selectedVendorId,
              note: noteInput.trim() || undefined,
            });
          } else {
            buffer = await generatePurchaseOrderPdf(order.order_id, {
              vendorId: selectedVendorId,
              note: noteInput.trim() || undefined,
              rowOffset: 0,
            });
          }
        } else {
          if (downloadFormat === "xlsx") {
            buffer = await generateAssetRequestExcel(order.order_id, {
              documentCode: order.order_code?.trim() || undefined,
              remarks: remarksInput.trim() || undefined,
            });
          } else {
            buffer = await generateAssetRequestPdf(order.order_id, {
              documentCode: order.order_code?.trim() || undefined,
              remarks: remarksInput.trim() || undefined,
            });
          }
        }

        await writeFile(filePath, buffer);
        const docTitle = isPurchaseOrder ? "Purchase Order" : "Form Permintaan";
        showToast({
          body: `Dokumen ${docTitle} (.${ext}) berhasil diunduh!`,
          type: "info",
        });
        onClose();
      }
    } catch (err) {
      console.error("Download order document failed:", err);
      showToast({ body: "Gagal mengunduh dokumen.", type: "error" });
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
              <Heading level={3}>Unduh Dokumen</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <FormLayout>
                <Selector
                  label="Template Dokumen"
                  value={selectedTemplate}
                  onChange={(value) => setSelectedTemplate(value as OrderPdfTemplate)}
                  options={TEMPLATE_OPTIONS}
                />

                <RadioList
                  label="Format Unduhan"
                  value={downloadFormat}
                  onChange={(value) => setDownloadFormat(value as "xlsx" | "pdf")}
                  orientation="horizontal"
                >
                  <RadioListItem label="Excel (.xlsx)" value="xlsx" />
                  <RadioListItem label="PDF (.pdf)" value="pdf" />
                </RadioList>

                {isPurchaseOrder ? (
                  <>
                    <Selector
                      label="Vendor Tujuan"
                      options={vendorOptions}
                      value={selectedVendorId}
                      onChange={(value) => setSelectedVendorId(value)}
                      placeholder="Pilih vendor..."
                      isDisabled={vendorOptions.length === 0}
                      isRequired
                    />
                    <TextArea
                      label="Catatan (opsional)"
                      value={noteInput}
                      onChange={setNoteInput}
                      placeholder="Masukkan catatan..."
                      rows={3}
                    />
                  </>
                ) : (
                  <TextArea
                    label="Catatan (opsional)"
                    value={remarksInput}
                    onChange={setRemarksInput}
                    placeholder="Masukkan catatan..."
                    rows={3}
                  />
                )}

                {vendorOptions.length === 0 && isPurchaseOrder ? (
                  <Text size="sm" color="secondary">
                    Pengadaan ini belum memiliki item/vendor.
                  </Text>
                ) : null}
              </FormLayout>
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
                  label={downloadFormat === "xlsx" ? "Unduh Excel" : "Unduh PDF"}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
