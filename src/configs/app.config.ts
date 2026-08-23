import { ClipboardList, Folder, LayoutDashboard, Settings, ShoppingCart, Truck } from "lucide-react";

export enum AppRole {
  MANAGER = "Manager",
  LOGISTICS_STAFF = "Staff Logistik",
}

export const APP = {
  defaultRole: AppRole.MANAGER,
  companyName: "PT SANG BIMA RATU",
  sidenav: [
    {
      label: "Laporan",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      icon: ClipboardList,
      label: "Kebutuhan (BOM)",
      href: "/requirement",
    },
    {
      label: "Pemesanan (PO)",
      icon: ShoppingCart,
      href: "/order",
    },
    {
      label: "Penerimaan (NP)",
      icon: Truck,
      href: "/receipt",
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
      ],
    },
    {
      label: "Pengaturan",
      icon: Settings,
      href: "/settings",
    },
  ],
  title: "Manajemen Proyek",
  settingsNav: [
    {
      id: "database",
      label: "Database",
      href: "/settings/database",
    },
    {
      id: "security",
      label: "Keamanan",
      href: "/settings/security",
    },
    {
      id: "appearance",
      label: "Tampilan",
      href: "/settings/appearance",
    },
  ],
};

export function getUserRole(): AppRole {
  const envRole = import.meta.env.VITE_APP_ROLE?.toUpperCase();
  const roleKey = envRole as keyof typeof AppRole;
  return AppRole[roleKey] || APP.defaultRole;
}
