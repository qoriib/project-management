import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useAppStore } from "@/store/useAppStore";
import { usePOStore } from "@/store/usePOStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { todayISO } from "@/utils/formatters";
import {
  deliverySchema,
  type DeliveryFormProps,
  type DeliveryItemRow,
} from "./delivery.schema";
import {
  loadPOItemsAsDeliveryRows,
  loadDeliveryEditData,
  buildDeliveryItemPayload,
} from "./delivery.utils";

// ── useDeliveryForm ───────────────────────────────────────────────────────────

/**
 * Custom hook yang mengorkestrasikan seluruh logic form Delivery:
 * - Inisialisasi & load data (create / edit)
 * - Load items saat PO berubah
 * - Submit handler (create / update)
 */
export function useDeliveryForm({
  initialPoId,
  initialEditId,
  onSuccess,
}: Pick<DeliveryFormProps, "initialPoId" | "initialEditId" | "onSuccess">) {
  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { pos, loadAllPOs } = usePOStore();
  const { createDelivery, updateDelivery } = useDeliveryStore();

  const form = useForm({
    defaultValues: {
      poId: initialPoId ?? "",
      deliveryDate: todayISO(),
      items: [] as DeliveryItemRow[],
    },
    validators: { onChange: deliverySchema },
    onSubmit: async ({ value }) => {
      const payload = buildDeliveryItemPayload(value.items);
      const header = {
        po_id: Number(value.poId),
        delivery_date: value.deliveryDate,
      };

      if (isEdit) {
        await updateDelivery(initialEditId!, header, payload);
      } else {
        await createDelivery(header, payload);
      }
      onSuccess(Number(value.poId));
    },
  });

  /** Load items ke form saat user memilih PO baru (mode create) */
  async function handlePOChange(poId: string) {
    form.setFieldValue("poId", poId);
    if (poId) {
      const rows = await loadPOItemsAsDeliveryRows(Number(poId));
      form.setFieldValue("items", rows);
    } else {
      form.setFieldValue("items", []);
    }
  }

  useEffect(() => {
    async function loadData() {
      await loadAllPOs(selectedProjectId ?? undefined);

      if (isEdit && initialEditId) {
        const editData = await loadDeliveryEditData(initialEditId);
        if (editData) {
          form.setFieldValue("poId", editData.poId);
          form.setFieldValue("deliveryDate", editData.deliveryDate);
          form.setFieldValue("items", editData.items);
        }
      } else if (initialPoId) {
        const rows = await loadPOItemsAsDeliveryRows(Number(initialPoId));
        form.setFieldValue("items", rows);
      }
    }
    loadData();
  }, [initialPoId, initialEditId, isEdit, selectedProjectId]);

  return { form, pos, isEdit, handlePOChange };
}
