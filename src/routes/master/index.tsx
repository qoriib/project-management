import { createFileRoute } from "@tanstack/react-router";
import { MasterTabItem } from "@/components/master/MasterTabItem";

export const Route = createFileRoute("/master/")({
  component: () => <MasterTabItem />,
});
