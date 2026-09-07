import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

function EditReceiptPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  return <ReceiptForm receiptId={id} onSuccess={(poId) => navigate({ to: `/order/${poId}` })} />;
}

export const Route = createFileRoute("/receipt/$id/edit")({
  component: EditReceiptPage,
});
