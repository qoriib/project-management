import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Text } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { LoadingState } from "@/components/shared/LoadingState";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";
import { useReceiptStore } from "@/store/useReceiptStore";

function ReceiptEditPage() {
  const { id } = useParams({ strict: false });
  const { currentReceipt: receipt, loadReceiptDetail, clearReceiptDetail } = useReceiptStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      await loadReceiptDetail(id as string);
      setLoading(false);
    }
    load();
    return () => clearReceiptDetail();
  }, [id, loadReceiptDetail, clearReceiptDetail]);

  if (loading) return <LoadingState message="Memuat data Penerimaan…" />;

  if (!receipt)
    return (
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <Text color="secondary">Penerimaan tidak ditemukan.</Text>
          </LayoutContent>
        }
      />
    );

  return <ReceiptForm receipt={receipt} />;
}

export const Route = createFileRoute("/receipt/$id/edit")({
  component: ReceiptEditPage,
});
