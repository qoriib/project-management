import { vendorRepo } from "@/db/repositories";

export async function seedVendors(): Promise<void> {
  const vendors = [
    { vendor_name: "TB. Sinar Bangunan", phone: "081234567890", address: "Jl. Pembangunan Raya No. 12, Jakarta" },
    { vendor_name: "PT. Baja Jaya Nusantara", phone: "021-9876543", address: "Kawasan Industri Cikarang Blok B2" },
    { vendor_name: "CV. Sumber Pasir", phone: "085677788899", address: "Jl. Raya Bogor No. 88, Depok" },
    { vendor_name: "Toko Cat Warna Indah", phone: "081912312312", address: "Jl. Merdeka No. 45, Bandung" },
    { vendor_name: "PT. Keramik Indah", phone: "021-5551234", address: "Jl. Gatot Subroto Kav. 1, Jakarta" },
    { vendor_name: "Sewa Alat Berat Nusantara", phone: "081199998888", address: "Jl. Perintis Kemerdekaan, Bekasi" },
    { vendor_name: "Depo Bangunan Mandiri", phone: "021-8889990", address: "Jl. Serpong Raya No. 10, Tangerang" }
  ];

  for (const v of vendors) {
    const exists = await vendorRepo.exists({ vendor_name: v.vendor_name }, true);
    if (!exists) {
      await vendorRepo.create(v);
    }
  }
}
