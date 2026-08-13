import { createFileRoute } from "@tanstack/react-router";
import { MasterTabStage } from "@/components/master/MasterTabStage";

export const Route = createFileRoute("/master/stage")({
  component: () => <MasterTabStage />,
});
