import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useToast } from "@astryxdesign/core/Toast";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOStore } from "@/store/usePOStore";
import { useBOMStore } from "@/store/useBOMStore";
import { todayISO } from "@/utils/formatters";
import { poSchema, type POFormItemValue } from "./po.schema";
import { buildPOItemPayload } from "./po.utils";

interface UsePOFormOptions {
  initialEditId?: string;
  onSuccess: () => void;
}

/**
 * Orchestrates PO form logic:
 * - Initialization & form reset
 * - Loading BOM & master data
 * - Preloading edit data (edit mode)
 * - Submit handler
 */
export function usePOForm({ initialEditId, onSuccess }: UsePOFormOptions) {
  const showToast = useToast();

  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const vendors = useMasterStore((s) => s.vendors);
  const itemPricesMap = useMasterStore((s) => s.itemPricesMap);
  const loadAllMasters = useMasterStore((s) => s.loadAllMasters);
  const loadItemPrices = useMasterStore((s) => s.loadItemPrices);
  const { createPO, updatePO, loadPODetail } = usePOStore();
  const boms = useBOMStore((s) => s.boms);
  const loadBOMs = useBOMStore((s) => s.loadBOMs);

  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      po_date: todayISO(),
      items: [] as POFormItemValue[],
    },
    validators: {
      onChange: poSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const projectId = isEdit ? editProjectId : selectedProjectId;

        if (!projectId) {
          showToast({ body: "Proyek belum dipilih.", type: "error" });
          return;
        }

        const poData = {
          po_date: value.po_date,
          project_id: projectId,
        };

        const poItems = buildPOItemPayload(value.items);

        if (isEdit && initialEditId) {
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

  async function loadData() {
    await loadAllMasters();

    if (isEdit && initialEditId) {
      await loadPODetail(initialEditId);
      const { currentPO: po, currentItems: poItems } = usePOStore.getState();

      if (po) {
        setEditProjectId(po.project_id);
        await loadBOMs(po.project_id);

        const rawItemIds = poItems.map((p) => p.item_id).filter(Boolean);
        const uniqueItemIds = [...new Set(rawItemIds)] as string[];
        await Promise.all(uniqueItemIds.map((id) => loadItemPrices(id)));

        const mappedItems = poItems.map((p) => ({
          po_item_id: p.po_item_id,
          item_id: p.item_id || "",
          vendor_id: String(p.vendor_id || ""),
          item_price_id: String(p.item_price_id || ""),
          qty: p.qty,
          original_qty: p.qty,
        }));

        form.reset({
          po_date: po.po_date,
          items: mappedItems,
        });
      }
    } else if (selectedProjectId) {
      await loadBOMs(selectedProjectId);
      form.reset({
        po_date: todayISO(),
        items: [],
      });
    }
  }

  useEffect(() => {
    loadData();
  }, [isEdit, initialEditId, selectedProjectId]);

  return { form, bomData: boms, itemPricesMap, vendors };
}
