import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOStore } from "@/store/usePOStore";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/services";
import { todayISO } from "@/utils/formatters";
import { poSchema, type POFormItemValue } from "./po.schema";
import { buildPOItemPayload } from "./po.utils";
import { usePriceCache } from "./usePriceCache";

interface UsePOFormOptions {
  initialEditId?: number;
  onSuccess: () => void;
}

/**
 * Orchestrates semua logic form PO:
 * - Inisialisasi & reset form
 * - Load BOM data
 * - Pre-load data edit (jika mode edit)
 * - Submit handler
 */
export function usePOForm({ initialEditId, onSuccess }: UsePOFormOptions) {
  const showToast = useToast();

  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { vendors } = useMasterStore();
  const { createPO, updatePO, loadPODetail } = usePOStore();

  const [bomData, setBomData] = useState<DashboardBOMReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { priceCache, getPricesForItem, preloadPrices } = usePriceCache();

  const form = useForm({
    defaultValues: {
      poDate: todayISO(),
      // Explicit cast so TanStack Form infers the correct items type (not never[])
      items: [] as POFormItemValue[],
    },
    validators: {
      onChange: poSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const poData = {
          po_date: value.poDate,
          project_id: selectedProjectId!,
        };

        const poItems = buildPOItemPayload(value.items);

        if (isEdit) {
          await updatePO(initialEditId, poData, poItems);
          showToast({ body: "PO berhasil diperbarui", type: "info" });
        } else {
          await createPO(poData, poItems);
          showToast({ body: "PO berhasil dibuat", type: "info" });
        }

        onSuccess();
      } catch (error: unknown) {
        const isError = error instanceof Error;
        const msg = isError ? error.message : "Terjadi kesalahan";
        showToast({ body: msg, type: "error" });
      }
    },
  });

  useEffect(() => {
    async function loadData() {
      const hasProject = !!selectedProjectId;

      if (!hasProject) {
        setLoading(false);
        return;
      }

      const bom = await getDashboardBOMReport(selectedProjectId);
      setBomData(bom);

      if (isEdit) {
        await loadPODetail(initialEditId);
        const { currentPO: po, currentItems: poItems } = usePOStore.getState();

        const hasData = po !== null && po !== undefined;

        if (hasData) {
          const rawItemIds = poItems.map((p) => p.item_id).filter(Boolean);
          const uniqueItemIds = [...new Set(rawItemIds)] as number[];
          await preloadPrices(uniqueItemIds);

          const mappedItems = poItems.map((p) => ({
            po_item_id: p.po_item_id,
            item_id: p.item_id || 0,
            vendor_id: String(p.vendor_id || ""),
            item_price_id: String(p.item_price_id || ""),
            qty: p.qty,
            original_qty: p.qty,
          }));

          form.reset({
            poDate: po!.po_date,
            items: mappedItems,
          });
        }
      } else {
        form.reset({ poDate: todayISO(), items: [] });
      }

      setLoading(false);
    }

    loadData();
  }, [isEdit, initialEditId, selectedProjectId]); // form & preloadPrices are stable

  return { form, bomData, priceCache, getPricesForItem, loading, vendors, isEdit };
}
