import { createFileRoute } from "@tanstack/react-router";
import { OrderForm } from "@/components/order/OrderForm";

function NewOrderPage() {
  return <OrderForm />;
}

export const Route = createFileRoute("/order/new")({
  component: NewOrderPage,
});
