import { ClipboardList, Folder, Home, ShoppingCart, Truck } from "lucide-react";

export const APP = {
  title: "Manajemen Proyek",
  sidenav: [
    {
      label: "Dashboard",
      icon: Home,
      href: "/"
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
      subitems: [
        { label: "Proyek", href: "/master/project" },
        { label: "Item", href: "/master/item" },
        { label: "Vendor", href: "/master/vendor" },
        { label: "Kategori", href: "/master/kategori" },
        { label: "Satuan", href: "/master/satuan" },
      ]
    }
  ]
}