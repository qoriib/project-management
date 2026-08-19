import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/master")({
  component: () => <Outlet />,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/master" || location.pathname === "/master/") {
      throw redirect({ to: "/master/item" });
    }
  },
});
