import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Dialog, FormLayout, HStack, Heading, Selector, Text, TextArea, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { generateAssetRequestPdf, generatePurchaseOrderPdf } from "@/db/services/pdf";
import type { OrderPdfTemplate } from "@/db/services/pdf";
import type { OrderItemDetail, OrderWithSummary } from "@/db/repositories";

interface OrderPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithSummary;
  items: OrderItemDetail[];
}

const TEMPLATE_OPTIONS = [
  { value: "purchase-order", label: "Purchase Order (Nota Fisik)" },
  { value: "asset-request", label: "Form Permintaan Barang/Alat" },
];

export function OrderPrintDialog({ isOpen, onClose, order, items }: OrderPrintDialogProps) {
  const showToast = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<OrderPdfTemplate>("purchase-order");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [rowOffset, setRowOffset] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Daftar vendor unik dari item order
  const vendorOptions = useMemo(() => {
    const vendorMap = new Map<string, string>();
    for (const item of items) {
      if (item.vendor_id && !vendorMap.has(item.vendor_id)) {
        vendorMap.set(item.vendor_id, item.vendor_name ?? item.vendor_id);
      }
    }
    return Array.from(vendorMap.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);

  // Inisialisasi saat dialog terbuka
  useEffect(() => {
    if (!isOpen) return;

    setSelectedTemplate("purchase-order");
    setSelectedVendorId(vendorOptions[0]?.value ?? "");
    setNoteInput("");
    setRemarksInput("");
    setRowOffset(0);
  }, [isOpen, vendorOptions]);

  const isPurchaseOrder = selectedTemplate === "purchase-order";
  const canPrint = isPurchaseOrder ? Boolean(selectedVendorId) : true;

  // Generate preview PDF setiap kali parameter berubah
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let currentBlobUrl: string | null = null;

    if (isPurchaseOrder && !selectedVendorId) {
      setPreviewUrl(null);
      return;
    }

    setIsLoadingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const buffer = isPurchaseOrder
          ? await generatePurchaseOrderPdf(order.order_id, {
              vendorId: selectedVendorId,
              note: noteInput.trim() || undefined,
              rowOffset,
            })
          : await generateAssetRequestPdf(order.order_id, {
              documentCode: order.order_code?.trim() || undefined,
              remarks: remarksInput.trim() || undefined,
            });

        if (!isMounted) return;

        const blob = new Blob([buffer as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        currentBlobUrl = URL.createObjectURL(blob);
        setPreviewUrl(currentBlobUrl);
      } catch (err) {
        if (isMounted) {
          console.error("Gagal membuat pratinjau dokumen:", err);
          showToast({ body: "Gagal memuat pratinjau dokumen.", type: "error" });
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreview(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [
    isOpen,
    isPurchaseOrder,
    order.order_id,
    order.order_code,
    selectedVendorId,
    noteInput,
    remarksInput,
    rowOffset,
    showToast,
  ]);

  const handlePrint = () => {
    if (!canPrint || !iframeRef.current) return;

    try {
      setIsPrinting(true);
      const iframeWindow = iframeRef.current.contentWindow;
      if (iframeWindow) {
        iframeWindow.focus();
        iframeWindow.print();
      } else {
        showToast({ body: "Pratinjau cetak belum siap.", type: "info" });
      }
    } catch (err) {
      console.error("Cetak dokumen gagal:", err);
      showToast({ body: "Gagal memanggil dialog cetak.", type: "error" });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      purpose="form"
      onOpenChange={(open) => {
        if (!open && !isPrinting) {
          onClose();
        }
      }}
      width={940}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handlePrint();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>Cetak Dokumen</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <HStack gap={6} width="100%" align="stretch">
                {/* Kolom Kiri: Form Kontrol */}
                <VStack gap={4} width={340}>
                  <FormLayout>
                    <Selector
                      label="Template Dokumen"
                      value={selectedTemplate}
                      onChange={(value) => setSelectedTemplate(value as OrderPdfTemplate)}
                      options={TEMPLATE_OPTIONS}
                    />

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

                        {/* Penyesuaian Posisi Cetak Vertikal */}
                        <VStack gap={2} width="100%">
                          <Text weight="medium">Posisi Cetak Vertikal</Text>
                          <Text size="sm" color="secondary">
                            Geser teks ke atas atau ke bawah agar pas dengan garis blangko nota fisik.
                          </Text>
                          <HStack gap={2} align="center">
                            <Button
                              variant="secondary"
                              size="sm"
                              label="↑ Naik"
                              type="button"
                              onClick={() => setRowOffset((prev) => prev - 1)}
                              isDisabled={rowOffset <= -10}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              label="↓ Turun"
                              type="button"
                              onClick={() => setRowOffset((prev) => prev + 1)}
                              isDisabled={rowOffset >= 10}
                            />
                            <Text
                              weight="medium"
                              size="sm"
                              style={{
                                color: rowOffset !== 0 ? "var(--color-primary-default)" : "var(--color-text-secondary)",
                              }}
                            >
                              {rowOffset === 0
                                ? "Posisi Normal"
                                : rowOffset > 0
                                  ? `Turun ${rowOffset} baris (~${rowOffset * 5} mm)`
                                  : `Naik ${Math.abs(rowOffset)} baris (~${Math.abs(rowOffset) * 5} mm)`}
                            </Text>
                            {rowOffset !== 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                label="Reset"
                                type="button"
                                onClick={() => setRowOffset(0)}
                              />
                            ) : null}
                          </HStack>
                        </VStack>
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
                </VStack>

                {/* Kolom Kanan: Pratinjau Dokumen */}
                <VStack gap={2} align="stretch" height={540} style={{ flex: 1 }}>
                  <HStack justify="between" align="center" width="100%">
                    <Text weight="medium">Pratinjau Dokumen</Text>
                    {isLoadingPreview ? (
                      <Text size="sm" color="secondary">
                        Memperbarui pratinjau...
                      </Text>
                    ) : null}
                  </HStack>

                  {previewUrl ? (
                    <iframe
                      ref={iframeRef}
                      src={`${previewUrl}#toolbar=0&navpanes=0`}
                      title="Pratinjau Dokumen"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface-subtle)",
                      }}
                    />
                  ) : (
                    <VStack
                      align="center"
                      justify="center"
                      height="100%"
                      style={{
                        border: "1px dashed var(--color-border-subtle)",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--color-surface-subtle)",
                      }}
                    >
                      <Text color="secondary" size="sm">
                        Pilih vendor untuk menampilkan pratinjau dokumen.
                      </Text>
                    </VStack>
                  )}
                </VStack>
              </HStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <HStack gap={2} justify="end" width="100%">
                <Button variant="secondary" type="button" onClick={onClose} isDisabled={isPrinting} label="Batal" />
                <Button
                  variant="primary"
                  type="submit"
                  isDisabled={isPrinting || !canPrint || !previewUrl || isLoadingPreview}
                  isLoading={isPrinting}
                  label="Cetak"
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
