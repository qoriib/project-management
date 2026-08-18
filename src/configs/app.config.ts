import { ClipboardList, Folder, Home, ShoppingCart, Truck, Settings } from "lucide-react";

export enum AppRole {
  MANAGER = 'Manager',
  LOGISTICS_STAFF = 'Staff Logistik'
}

export const APP = {
  title: "Manajemen Proyek",
  companyName: "Nusantara Fiktif PT",
  sidenav: [
    {
      label: "Laporan",
      icon: Home,
      href: "/"
    },
    {
      icon: ClipboardList,
      label: "Kebutuhan (BOM)",
      href: "/bom"
    },
    {
      label: "Pemesanan (PO)",
      icon: ShoppingCart,
      href: "/po"
    },
    {
      label: "Penerimaan (DLV)",
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
    },
    {
      label: "Pengaturan",
      icon: Settings,
      href: "/settings"
    }
  ]
}