import { createFileRoute } from "@tanstack/react-router";
import { MasterTabCategory } from "@/components/master/MasterTabCategory";

export const Route = createFileRoute("/master/kategori")({
  component: () => <MasterTabCategory />,
});
