import { vendorRepo } from "@/db/repositories";

export async function seedVendors(): Promise<void> {
  const vendors = [
    {
      address: "Jl. Pembangunan Raya No. 12, Jakarta",
      phone: "081234567890",
      vendor_name: "TB. Sinar Bangunan",
    },
    {
      address: "Kawasan Industri Cikarang Blok B2",
      phone: "021-9876543",
      vendor_name: "PT. Baja Jaya Nusantara",
    },
    {
      address: "Jl. Raya Bogor No. 88, Depok",
      phone: "085677788899",
      vendor_name: "CV. Sumber Pasir",
    },
    {
      address: "Jl. Merdeka No. 45, Bandung",
      phone: "081912312312",
      vendor_name: "Toko Cat Warna Indah",
    },
    {
      address: "Jl. Gatot Subroto Kav. 1, Jakarta",
      phone: "021-5551234",
      vendor_name: "PT. Keramik Indah",
    },
    {
      address: "Jl. Perintis Kemerdekaan, Bekasi",
      phone: "081199998888",
      vendor_name: "Sewa Alat Berat Nusantara",
    },
    {
      address: "Jl. Serpong Raya No. 10, Tangerang",
      phone: "021-8889990",
      vendor_name: "Depo Bangunan Mandiri",
    },
  ];

  for (const v of vendors) {
    const exists = await vendorRepo.exists(
      { vendor_name: v.vendor_name },
      true,
    );
    if (!exists) {
      await vendorRepo.create(v);
    }
  }
}
