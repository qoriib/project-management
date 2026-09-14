import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAssetRequestPdf } from "../../src/db/services/pdf/asset-request-pdf";
import { formatPriceSuffix } from "../../src/db/services/pdf/order-pdf.service";
import { createPurchaseOrderPdf } from "../../src/db/services/pdf/purchase-order-pdf";

type PdfWithLastTable = {
  lastAutoTable?: {
    body: Array<{ cells: Record<number, { text: string[]; colSpan?: number }> }>;
  };
};

const baseItems = [
  { no: 1, name_with_price: "Batu Belah @Rp. 280.000,-", qty_display: "25", unit: "M3" },
  { no: 2, name_with_price: "Semen Padang @Rp. 74.500,-", qty_display: "100", unit: "Zak" },
];

// 1. Uji Purchase Order
const purchaseOrder = createPurchaseOrderPdf({
  title: "PURCHASE ORDER",
  order_code: "124/YMS-KM.10/IX/2026",
  order_date_display: "04/09/2026",
  vendor_name: "PT. BIMA 1 (PJR)",
  package_name: "Preservasi Jl & Jembatan Ruas KM.10",
  year: 2026,
  company_name: "PT. Yerman Makmur Sejahtera",
  items: [{ no: 1, name_with_price: "Batu Belah @Rp. 280.000,-", qty_display: "6 M³", unit: "M3" }],
  note: "Diambil Sendiri\nHarga Sudah + Ppn\nDiambil Besok Pagi\nUntuk Ko'ordinasi Pengiriman Dengan\nEdot Hp : 0853 7944 5344",
}) as unknown as PdfWithLastTable;

const purchaseRows = purchaseOrder.lastAutoTable?.body ?? [];
assert.equal(purchaseRows.length, 10, "Tabel PO harus memiliki tepat 10 baris grid formulir");
// Baris ke-1 kolom BANYAK NYA harus menampilkan angka dan satuan
assert.equal(
  purchaseRows[0]?.cells[3]?.text.join(" "),
  "6 M³",
  "Kolom BANYAK NYA harus menampilkan angka beserta satuan",
);
// Baris ke-2 (index 1) adalah catatan pertama pada kolom NAMA BARANG (cells[1])
assert.equal(
  purchaseRows[1]?.cells[1]?.text.join(" "),
  "Diambil Sendiri",
  "Catatan PO harus dirender pada kolom NAMA BARANG",
);
assert.equal(formatPriceSuffix(0), " @Rp. 0,-", "Harga nol harus tetap ditampilkan pada nama barang");

// 2. Uji Form Permintaan Barang/Alat (Asset Control)
const assetRequest = createAssetRequestPdf({
  company_line: "CIVIL ENGINEERING & GENERAL CONTRACTORS",
  company_name: "PT. Adiguna Anugrah Abadi",
  project_name: "Paket Pelebaran Jalan Menuju Standar Lempasing - Pd. Cermin",
  fiscal_year: 2026,
  document_code: "039/AAA-LPC/IX/2026",
  items: [
    { no: 1, name_with_price: "Seling @Rp. 30.000,-", item_code: "SL-01", qty_display: "10", unit: "M" },
    { no: 2, name_with_price: "Klem @Rp. 7.500,-", item_code: "KL-02", qty_display: "8", unit: "Buah" },
  ],
  location: "Bandar Lampung",
  date_display: "04/09/2026",
  remarks: "Lokasi Mess Martadinata\nHarap diantar besok pagi",
}) as unknown as PdfWithLastTable;

const assetRows = assetRequest.lastAutoTable?.body ?? [];
assert.ok(assetRows.length >= 8, "Tabel Asset Control harus memiliki minimal 8 baris grid");
// Kolom KODE RAPP (index 2)
assert.equal(assetRows[0]?.cells[2]?.text.join(" "), "SL-01", "Kolom KODE RAPP baris 1 harus berisi item_code");
assert.equal(assetRows[1]?.cells[2]?.text.join(" "), "KL-02", "Kolom KODE RAPP baris 2 harus berisi item_code");
// Keterangan dibuat 1 cell saja keseluruhan pada baris pertama (merged via rowSpan)
assert.match(
  assetRows[0]?.cells[5]?.text.join(" ") ?? "",
  /Lokasi Mess Martadinata.*Harap diantar besok pagi/,
  "Keterangan harus utuh dalam 1 cell di baris pertama",
);

// Simpan berkas uji coba ke direktori sementara OS (bukan ke dalam repo).
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "order-pdf-"));

fs.writeFileSync(
  path.join(outDir, "test_purchase_order.pdf"),
  Buffer.from((purchaseOrder as unknown as { output: (t: string) => ArrayBuffer }).output("arraybuffer")),
);
fs.writeFileSync(
  path.join(outDir, "test_asset_control.pdf"),
  Buffer.from((assetRequest as unknown as { output: (t: string) => ArrayBuffer }).output("arraybuffer")),
);

console.log(`Semua pengujian struktur tabel dan dokumen PDF berhasil! Berkas uji: ${outDir}`);
