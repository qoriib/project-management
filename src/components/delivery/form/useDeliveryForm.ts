import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useAppStore } from "@/store/useAppStore";
import { usePOStore } from "@/store/usePOStore";
import { useDeliveryStore } from "@/store/useDeliveryStore";
import { todayISO } from "@/utils/formatters";
import { loadPOItemsAsDeliveryRows, loadDeliveryEditData, buildDeliveryItemPayload } from "./delivery.utils";
import { deliverySchema, type DeliveryFormProps, type DeliveryItemRow } from "./delivery.schema";

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
      po_id: initialPoId ?? "",
      delivery_date: todayISO(),
      items: [] as DeliveryItemRow[],
    },
    validators: { onChange: deliverySchema },
    onSubmit: async ({ value }) => {
      const payload = buildDeliveryItemPayload(value.items);

      const header = {
        po_id: Number(value.po_id),
        delivery_date: value.delivery_date,
      };

      if (isEdit) {
        await updateDelivery(initialEditId!, header, payload);
      } else {
        await createDelivery(header, payload);
      }

      const poId = Number(value.po_id);
      onSuccess(poId);
    },
  });

  /** Load items ke form saat user memilih PO baru (mode create) */
  async function handlePOChange(poId: string) {
    form.setFieldValue("po_id", poId);

    const hasSelectedPO = poId.length > 0;

    if (hasSelectedPO) {
      const rows = await loadPOItemsAsDeliveryRows(Number(poId));
      form.setFieldValue("items", rows);
    } else {
      form.setFieldValue("items", []);
    }
  }

  useEffect(() => {
    async function loadData() {
      const projectId = selectedProjectId ?? undefined;
      await loadAllPOs(projectId);

      const hasEditId = isEdit && initialEditId !== undefined;

      if (hasEditId) {
        const editData = await loadDeliveryEditData(initialEditId!);
        const hasData = editData !== null;

        if (hasData) {
          form.setFieldValue("po_id", editData!.po_id);
          form.setFieldValue("delivery_date", editData!.delivery_date);
          form.setFieldValue("items", editData!.items);
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
