import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ReceiptForm } from "@/components/receipt/ReceiptForm";

const searchSchema = z.object({
  order: z.string().optional(),
});

function NewReceiptPage() {
  const navigate = useNavigate();
  const { order: initialPoId } = Route.useSearch();

  return <ReceiptForm initialPoId={initialPoId} onSuccess={(poId) => navigate({ to: `/order/${poId}` })} />;
}

export const Route = createFileRoute("/receipt/new")({
  component: NewReceiptPage,
  validateSearch: searchSchema,
});
