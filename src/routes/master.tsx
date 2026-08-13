import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/master')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/master' || location.pathname === '/master/') {
      throw redirect({ to: '/master/item' });
    }
  },
  component: () => <Outlet />,
})
