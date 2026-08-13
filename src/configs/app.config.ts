import { ClipboardList, Folder, Home, ShoppingCart, Truck } from "lucide-react";

export const APP = {
  title: "Manajemen Proyek",
  sidenav: [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard"
    },
    {
      icon: ClipboardList,
      label: "Kebutuhan",
      href: "/bom"
    },
    {
      label: "Pemesanan",
      icon: ShoppingCart,
      href: "/po"
    },
    {
      label: "Penerimaan",
      icon: Truck,
      href: "/delivery"
    },
    {
      label: "Master Data",
      icon: Folder,
      href: "/master"
    }
  ]
}