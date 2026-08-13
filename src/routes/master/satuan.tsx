import { createFileRoute } from "@tanstack/react-router";
import { MasterTabUnit } from "@/components/master/MasterTabUnit";

export const Route = createFileRoute("/master/satuan")({
  component: () => <MasterTabUnit />,
});
