/** Pilihan template ekspor PDF dari data pengadaan (PO). */
export type OrderPdfTemplate = "purchase-order" | "asset-request";

/** Baris item siap render pada dokumen PDF pengadaan. */
export interface OrderPdfItem {
  no: number;
  /** Nama barang beserta harga satuan (e.g. "Batu Belah @Rp. 280.000,-") */
  name_with_price: string;
  /** Qty terformat (id-ID) */
  qty_display: string;
  unit: string;
  /** Kode item / KODE RAPP untuk form permintaan barang/alat */
  item_code?: string;
}

/**
 * Konteks render dokumen Purchase Order (satu dokumen per vendor).
 * Field placeholder (nama supir, no polisi, jenis/merek, catatan) hanya
 * untuk kebutuhan cetak — tidak tersimpan ke database.
 */
export interface PurchaseOrderPdfContext {
  title: string;
  order_code: string;
  order_date_display: string;
  vendor_name: string;
  package_name: string;
  year: number | string;
  company_name: string;
  items: OrderPdfItem[];
  note: string;
  /**
   * Jika true (default), hanya mencetak isi teks untuk kertas formulir nota fisik (tanpa garis tabel & tanpa teks statis PO).
   * Jika false, mencetak formulir lengkap dengan garis tabel dan teks statis.
   */
  preprintedOnly?: boolean;
}

/** Konteks render dokumen Form Permintaan Barang/Alat (Asset Control). */
export interface AssetRequestPdfContext {
  company_line: string;
  company_name?: string;
  project_name: string;
  fiscal_year: number | string;
  document_code: string;
  items: OrderPdfItem[];
  location: string;
  date_display: string;
  /** Keterangan umum yang dirender sebagai baris terakhir di dalam tabel */
  remarks: string;
}

/** Opsi pembuatan dokumen Purchase Order dari satu order. */
export interface GeneratePurchaseOrderOptions {
  /** ID vendor tujuan (wajib — satu dokumen hanya untuk satu vendor) */
  vendorId: string;
  /** Nomor PO manual (default: order_code pada database) */
  orderCodeOverride?: string;
  /** Catatan yang dirender di bawah daftar barang */
  note?: string;
  /** Cetak isi saja untuk kertas formulir nota fisik (default: true) */
  preprintedOnly?: boolean;
}

/** Opsi pembuatan dokumen Form Permintaan Barang/Alat dari satu order. */
export interface GenerateAssetRequestOptions {
  /** Nomor dokumen diisi manual sebelum unduh */
  documentCode?: string;
  /** Keterangan umum di bawah daftar barang (tidak disimpan ke database) */
  remarks?: string;
}

/** Blok tanda tangan pada footer Form Permintaan. */
export interface AssetRequestSignature {
  role: string;
  name: string;
  position: string;
}
