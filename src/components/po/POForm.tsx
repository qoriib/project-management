import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button, Card, HStack, VStack } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput } from "@astryxdesign/core/DateInput";
import { useToast } from "@astryxdesign/core/Toast";
import { POItemFormTable } from "./POItemFormTable";
import { todayISO } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import * as v from "valibot";
import type { POItemDetail, POItemInput, POWithSummary } from "@/db/repositories";
import type { BOMReportItem } from "@/db/services";
import { usePOStore } from "@/store/usePOStore";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "@tanstack/react-router";

const headerSchema = v.object({
  po_code: v.pipe(v.string(), v.nonEmpty("Nomor PO harus diisi.")),
  po_date: v.pipe(v.string(), v.nonEmpty("Tanggal PO harus diisi.")),
});

export interface POFormProps {
  po?: POWithSummary;
  initialItems?: POItemDetail[];
  bomData: BOMReportItem[];
}

export function POForm({ po, initialItems = [], bomData }: POFormProps) {
  const navigate = useNavigate(),
    showToast = useToast(),
    { createPO, updatePO } = usePOStore(),
    selectedProjectId = useAppStore((s) => s.selectedProjectId),
    [items, setItems] = useState<POItemDetail[]>(initialItems),
    form = useForm({
      defaultValues: {
        po_code: po?.po_code || "",
        po_date: po?.po_date || todayISO(),
      },
      onSubmit: async ({ value }) => {
        if (!selectedProjectId) {
          showToast({ body: "Proyek belum dipilih.", type: "error" });
          return;
        }

        const itemInputs: POItemInput[] = items.map((i) => ({
          po_item_id: i.po_item_id.startsWith("draft-") ? undefined : i.po_item_id,
          item_id: i.item_id,
          vendor_id: i.vendor_id,
          item_price_id: i.item_price_id,
          qty: i.qty,
        }));

        try {
          if (po) {
            await updatePO(
              po.po_id,
              { po_date: value.po_date, project_id: selectedProjectId, po_code: value.po_code },
              itemInputs,
            );
            showToast({ body: "PO berhasil diperbarui.", type: "info" });
            navigate({ to: `/po/${po.po_id}` });
          } else {
            const newPoId = await createPO(
              { po_date: value.po_date, project_id: selectedProjectId, po_code: value.po_code },
              itemInputs,
            );
            showToast({ body: "PO berhasil dibuat.", type: "info" });
            navigate({ to: `/po/${newPoId}` });
          }
        } catch (error: any) {
          showToast({
            body: error.message || "Terjadi kesalahan saat menyimpan PO",
            type: "error",
          });
        }
      },
      validators: { onChange: headerSchema },
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <VStack gap={6}>
        <HStack gap={4} width="50%">
          <VStack gap={1} style={{ flex: 1 }}>
            <form.Field name="po_code">
              {(field) => (
                <TextInput
                  label="Nomor PO"
                  placeholder="Misal: PO/2026/08/001"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v || "")}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            </form.Field>
          </VStack>
          <VStack gap={1} style={{ flex: 1 }}>
            <form.Field name="po_date">
              {(field) => (
                <DateInput
                  label="Tanggal PO"
                  value={field.state.value as any}
                  onChange={(v) => field.handleChange(v as any)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            </form.Field>
          </VStack>
        </HStack>
        <Card>
          <POItemFormTable items={items} onChange={setItems} bomData={bomData} />
        </Card>
        <HStack justify="end" gap={2}>
          <Button
            variant="secondary"
            type="button"
            label="Batal"
            onClick={() => {
              if (po) {
                navigate({ to: `/po/${po.po_id}` });
              } else {
                navigate({ to: "/po" });
              }
            }}
          />
          <form.Subscribe selector={(s) => s.canSubmit}>
            {(canSubmit) => (
              <Button
                variant="primary"
                type="submit"
                label={po ? "Simpan Perubahan" : "Buat PO"}
                isDisabled={!canSubmit}
              />
            )}
          </form.Subscribe>
        </HStack>
      </VStack>
    </form>
  );
}
