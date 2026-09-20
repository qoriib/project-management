import { itemPriceRepo, itemRepo } from "@/db/repositories";

export interface SeedItemPriceVariant {
  price: number;
  note: string;
}

/**
 * Data variasi harga realistis untuk setiap item master, mencakup:
 * - Tingkat harga standar (Toko / Depo)
 * - Tingkat harga eceran / ritel proyek
 * - Tingkat harga grosir pabrik / direct quarry / volume besar
 */
const itemPriceSeedData: Record<string, SeedItemPriceVariant[]> = {
  "Batu Kali": [
    { price: 180000, note: "Batu Kali Belah per m3 (Standar Lapangan)" },
    { price: 195000, note: "Batu Kali Gunung Sortir Keras" },
    { price: 170000, note: "Batu Kali Campur Direct Quarry" },
  ],
  "Batu Pecah / Split 1/2": [
    { price: 350000, note: "Split 1/2 Cor Readymix per m3" },
    { price: 375000, note: "Split Cuci Screening Halus Extra Bersih" },
    { price: 335000, note: "Direct Quarry Merak (Truk Tronton)" },
    { price: 340000, note: "Faktur Penyesuaian Pengiriman Proyek" },
  ],
  "Besi Beton Polos 8mm x 12m": [
    { price: 45000, note: "SNI Marking BTP (Toleransi 0.2mm)" },
    { price: 48000, note: "Full SNI Krakatau Steel" },
    { price: 42000, note: "Besi Pasar / Standar Lokal" },
    { price: 41000, note: "Diskon Khusus Volume Tunai" },
  ],
  "Besi Beton Polos 10mm x 12m": [
    { price: 72000, note: "SNI Marking BTP (Toleransi 0.2mm)" },
    { price: 76000, note: "Full SNI Krakatau Steel Sertifikat" },
    { price: 68000, note: "Besi Pasar / Standar Lokal" },
  ],
  "Besi Beton Ulir 13mm x 12m": [
    { price: 115000, note: "SNI Ulir TS420B Toleransi Ketat" },
    { price: 122000, note: "Full SNI Master Steel (MS)" },
    { price: 108000, note: "Besi Ulir Standar Pasar Proyek" },
  ],
  "Besi Beton Ulir 16mm x 12m": [
    { price: 165000, note: "SNI Ulir TS420B Mutu Beton Bertulang" },
    { price: 175000, note: "Full SNI Master Steel (MS)" },
    { price: 155000, note: "Besi Ulir Standar Pasar Proyek" },
  ],
  "Cat Tembok Eksterior 20L": [
    { price: 1250000, note: "Weatherproof Anti-Lumut & Jamur 20L" },
    { price: 1320000, note: "UV Shield Pelindung Ekstrem 5 Tahun" },
    { price: 1180000, note: "Cat Eksterior Standar Lapangan Proyek" },
  ],
  "Cat Tembok Interior 25kg (Pail)": [
    { price: 850000, note: "Cat Interior Mudah Dibersihkan (Pail)" },
    { price: 900000, note: "Cat Interior Premium Matt Finishing" },
    { price: 800000, note: "Cat Interior Standar Dinding Proyek" },
  ],
  "Granit Tile 60x60 (Cream)": [
    { price: 185000, note: "Granit Polished Glazed KW 1 per dus" },
    { price: 195000, note: "Granit Double Loading Nanoless Anti Noda" },
    { price: 175000, note: "Granit Tile KW 2 Proyek Komersial" },
  ],
  "Kabel NYM 3x2.5mm": [
    { price: 650000, note: "Kabel NYM SNI Tembaga Murni 50m" },
    { price: 690000, note: "Kabel NYM Merk Supreme 50m Rol" },
    { price: 620000, note: "Kabel NYM Merk Kabelindo Rol Standar" },
    { price: 640000, note: "Harga Grosir Proyek ME Paket" },
  ],
  "Kaso 5/7 Meranti": [
    { price: 35000, note: "Kayu Kaso Meranti MC Standar per btg" },
    { price: 38000, note: "Kayu Kaso Meranti Super Oven Kering" },
    { price: 32000, note: "Kayu Kaso Racuk Campur Bekisting" },
  ],
  "Kawat Bendrat": [
    { price: 22000, note: "Kawat Ikat Hitam BWG 21 per kg" },
    { price: 25000, note: "Kawat Putih Galvanis Anti Karat per kg" },
    { price: 20000, note: "Kawat Ikat Rol Curah per 20kg" },
  ],
  "Keramik Dinding 30x60": [
    { price: 95000, note: "Keramik Dinding Glossy KW 1 per dus" },
    { price: 102000, note: "Keramik Tekstur Motif Marmer Mewah" },
    { price: 88000, note: "Keramik KW 2 Standar Kamar Mandi" },
  ],
  "Lampu Downlight LED 12W": [
    { price: 55000, note: "LED Slim Round 12W Warm White Philips" },
    { price: 60000, note: "LED 3 Warna CCT Switchable Remote" },
    { price: 50000, note: "LED Downlight Standar Cool Daylight" },
  ],
  Mandor: [
    { price: 250000, note: "Upah Harian Mandor Pengawas Lapangan (8 Jam)" },
    { price: 275000, note: "Upah Mandor Khusus Struktur & K3 Safety" },
    { price: 225000, note: "Tarif Harian Kontrak Borongan Mingguan" },
  ],
  "Papan Cor 2/20 Meranti": [
    { price: 25000, note: "Papan Bekisting Meranti 2m Standar" },
    { price: 28000, note: "Papan Cor Tebal 2.5cm Sortir Halus" },
    { price: 22000, note: "Papan Cor Bekisting Hemat Sekali Pakai" },
  ],
  "Pasir Beton": [
    { price: 300000, note: "Pasir Cor Kasar per m3 (Truk Dumptruk)" },
    { price: 320000, note: "Pasir Cuci Extra Bersih Kadar Lumpur < 3%" },
    { price: 280000, note: "Pasir Cor Lokal Standar Proyek" },
  ],
  "Pasir Pasang": [
    { price: 250000, note: "Pasir Pasang Ayak Halus per m3" },
    { price: 265000, note: "Pasir Hitam Extra Bersih Plesteran" },
    { price: 235000, note: "Pasir Pasang Sungai Standar Murah" },
  ],
  "Perekat Bata Ringan / Mortar 40 Kg": [
    { price: 90000, note: "Mortar Thinbed Grade A Lem Bata Ringan" },
    { price: 95000, note: "Mortar Serbaguna Plester & Pasang" },
    { price: 85000, note: "Mortar Ekonomis Proyek Curah" },
  ],
  "Pipa PVC 1/2 inch tipe AW": [
    { price: 35000, note: "Pipa Air Bersih AW 4m Wavin/Rucika" },
    { price: 38000, note: "Pipa AW Tebal Tekanan Tinggi 10 Bar" },
    { price: 32000, note: "Pipa PVC Kelas D / Saluran Buang" },
  ],
  "Pipa PVC 4 inch tipe AW": [
    { price: 150000, note: "Pipa Saluran Utama 4m Wavin/Rucika" },
    { price: 160000, note: "Pipa Saluran Limbah Khusus Tebal SNI" },
    { price: 140000, note: "Pipa Saluran Air Hujan Drainase Standar" },
  ],
  "Semen Portland 50 Kg": [
    { price: 75000, note: "Harga Standar Depo Bangunan (Gresik/Tiga Roda)" },
    { price: 78000, note: "Harga Eceran Ritel (Antar Lapangan / Tangga)" },
    { price: 72000, note: "Grosir Direct Pabrik (Min. 200 Sak)" },
    { price: 79500, note: "Faktur Revisi Pengiriman Cepat Hari Libur" },
  ],
  "Semen Putih 40 Kg": [
    { price: 85000, note: "Semen Putih Acian Plamur Halus" },
    { price: 90000, note: "Semen Putih Super White Plafon & Ornamen" },
    { price: 80000, note: "Semen Putih Toko Grosir Sak Karung" },
  ],
  "Sewa Concrete Pump": [
    { price: 4500000, note: "Sewa Standar Harian (Maks. 8 Jam / 50 m3)" },
    { price: 4800000, note: "Sewa Concrete Pump Long Boom 32m" },
    { price: 4200000, note: "Sewa Standar Paket Multi-Hari Diskon" },
  ],
  "Sewa Excavator PC100": [
    { price: 180000, note: "Tarif Sewa per Jam (Operator Termasuk)" },
    { price: 200000, note: "Tarif All-in (Termasuk Bahan Bakar Solar & Mobilisasi)" },
    { price: 165000, note: "Tarif Paket Long-term Min 100 Jam" },
  ],
  "Triplek / Multiplek 9mm": [
    { price: 110000, note: "Triplek Cor Meranti 9mm Standar Bekisting" },
    { price: 118000, note: "Multiplek Film-Faced Phenolic Tahan Air" },
    { price: 102000, note: "Triplek Albasia Hemat Bekisting Bawah" },
  ],
  "Triplek / Multiplek 12mm": [
    { price: 145000, note: "Multiplek Cor Tahan Air 12mm Tebal Presisi" },
    { price: 155000, note: "Multiplek Film-Faced Phenolic Hitam 12mm" },
    { price: 138000, note: "Multiplek Meranti Standar Proyek" },
  ],
  "Tukang Batu / Pekerja": [
    { price: 150000, note: "Upah Harian Pekerja Terampil (8 Jam Kerja)" },
    { price: 165000, note: "Upah Shift Lembur / Kerja Akhir Pekan" },
    { price: 140000, note: "Upah Harian Borongan Mingguan Tim" },
  ],
  "Waterproofing 20kg": [
    { price: 750000, note: "Pelapis Kedap Air Semen Base 2 Komponen (Sika)" },
    { price: 800000, note: "Pelapis Bitumen Elastis 20kg Dak Terbuka" },
    { price: 700000, note: "Waterproofing Emulsi Pelapis Dinding Samping" },
  ],
};

export async function seedItemPrices(): Promise<void> {
  const items = await itemRepo.findAll();

  for (const item of items) {
    const variants = itemPriceSeedData[item.item_name] ?? [{ note: "Harga Satuan Standar", price: 0 }];
    const existingPrices = await itemPriceRepo.findByItem(item.item_id);

    for (const variant of variants) {
      const match = existingPrices.find((p) => p.price === variant.price);
      if (!match) {
        await itemPriceRepo.create({
          item_id: item.item_id,
          note: variant.note,
          price: variant.price,
        });
      } else if (match.note !== variant.note) {
        await itemPriceRepo.update(match.item_price_id, {
          note: variant.note,
        });
      }
    }
  }
}
