import { useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { LoadingState } from "@/components/shared/LoadingState";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useToast } from "@astryxdesign/core/Toast";
import { handleFormError } from "@/utils/form";
import { generateNextCode } from "@/utils/formatters";

function NewOrderPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { loadAllOrders, createEmptyOrder } = useOrderStore();
  const isCreating = useRef(false);

  useEffect(() => {
    if (!selectedProjectId || isCreating.current) return;
    isCreating.current = true;

    async function init() {
      try {
        await loadAllOrders(selectedProjectId ?? undefined);
        const currentOrders = useOrderStore.getState().orders;
        const nextOrderCode = generateNextCode(
          currentOrders.map((o) => o.order_code),
          "PO-",
        );
        const today = new Date().toISOString().split("T")[0];
        const newOrderId = await createEmptyOrder({
          project_id: selectedProjectId!,
          order_code: nextOrderCode,
          order_date: today,
        });
        navigate({ to: `/order/${newOrderId}/edit`, replace: true });
      } catch (error: unknown) {
        handleFormError(error, showToast);
      }
    }

    init();
  }, [selectedProjectId, loadAllOrders, createEmptyOrder, navigate, showToast]);

  if (!selectedProjectId) {
    return (
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <ProjectRequired>{null}</ProjectRequired>
          </LayoutContent>
        }
      />
    );
  }

  return <LoadingState message="Membuat Pengadaan Baru…" />;
}

export const Route = createFileRoute("/order/new")({
  component: NewOrderPage,
});
