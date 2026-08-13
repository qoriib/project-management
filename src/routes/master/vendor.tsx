import { createFileRoute } from "@tanstack/react-router";
import { MasterTabVendor } from "@/components/master/MasterTabVendor";

export const Route = createFileRoute("/master/vendor")({
  component: () => <MasterTabVendor />,
});
