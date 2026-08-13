import { createFileRoute } from "@tanstack/react-router";
import { MasterTabProject } from "@/components/master/MasterTabProject";

export const Route = createFileRoute("/master/project")({
  component: () => <MasterTabProject />,
});
