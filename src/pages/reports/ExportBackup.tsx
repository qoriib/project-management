import { useState } from "react";
import {
  Section, VStack, HStack, Button, Card, Heading, Text, Grid, Divider
} from "@astryxdesign/core";
import { PageHeader } from "../../components/PageHeader";
import { backupDatabase, restoreDatabase, exportMultiSheet, printToPDF } from "../../utils/export";
import { getProjects, getVendors, getItems } from "../../db/queries/master";
import { getPurchaseOrders } from "../../db/queries/po";
import { getDeliveries } from "../../db/queries/field";
import { getInvoices } from "../../db/queries/billing";

export default function ExportBackupPage() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleBackup() {
    setBackingUp(true);
    setMessage("");
    try {
      await backupDatabase();
      setMessage("Database berhasil dicadangkan (backup)!");
    } catch (err) {
      console.error(err);
      setMessage("Gagal mencadangkan database. Pastikan aplikasi berjalan di Tauri.");
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestore() {
    if (!confirm("Apakah Anda yakin ingin memulihkan database? Data saat ini akan ditimpa dengan file cadangan.")) return;
    setRestoring(true);
    setMessage("");
    try {
      await restoreDatabase(() => {
        setMessage("Database berhasil dipulihkan (restore)! Memuat ulang aplikasi...");
        setTimeout(() => window.location.reload(), 1500);
      });
    } catch (err) {
      console.error(err);
      setMessage("Gagal memulihkan database.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleExportAll() {
    setExporting(true);
    setMessage("");
    try {
      const [ps, vs, its, pos, del, inv] = await Promise.all([
        getProjects(),
        getVendors(),
        getItems(),
        getPurchaseOrders(),
        getDeliveries(),
        getInvoices(),
      ]);

      const sheets = [
        {
          name: "Proyek",
          data: ps.map((p) => ({
            "Kode Proyek": p.project_code,
            "Nama Proyek": p.project_name,
            "Kontraktor": p.contractor_name,
            "Tahun Anggaran": p.fiscal_year,
            "Status": p.status,
            "Tanggal Dibuat": p.created_at,
          })),
        },
        {
          name: "Vendor",
          data: vs.map((v) => ({
            "Nama Vendor": v.vendor_name,
            "Tipe": v.vendor_type,
            "Telepon": v.phone || "",
            "Alamat": v.address || "",
            "Tanggal Terdaftar": v.created_at,
          })),
        },
        {
          name: "Katalog Barang",
          data: its.map((i) => ({
            "Kode Barang": i.item_code || "",
            "Nama Barang": i.item_name,
            "Kategori": i.category,
            "Satuan": i.unit,
          })),
        },
        {
          name: "Purchase Orders (PO)",
          data: pos.map((po) => ({
            "Nomor PO": po.po_number,
            "Tanggal PO": po.po_date,
            "Vendor": po.vendor_name || "",
            "Proyek": po.project_name || "",
            "Subtotal (Rp)": po.subtotal_price || 0,
            "PPN (Rp)": po.ppn_amount || 0,
            "Total (Rp)": po.total_price || 0,
            "Catatan": po.notes || "",
          })),
        },
        {
          name: "Pengiriman (Deliveries)",
          data: del.map((d) => ({
            "Tanggal Kirim": d.delivery_date,
            "Nomor PO": d.po_number || "",
            "Nama Material": d.item_name || "",
            "Volume Kirim": d.delivered_volume,
            "Satuan": d.unit || "",
            "No. Surat Jalan": d.delivery_note_number || "",
            "Tujuan": d.location_destination || "",
            "Keterangan": d.notes || "",
          })),
        },
        {
          name: "Tagihan (Invoices)",
          data: inv.map((i) => ({
            "Nomor Invoice": i.invoice_number || "",
            "Tanggal Invoice": i.invoice_date,
            "Vendor": i.vendor_name || "",
            "Proyek": i.project_name || "",
            "Total Tagihan (Rp)": i.total_amount,
            "Jumlah Terbayar (Rp)": i.paid_amount,
            "Saldo Utang (Rp)": i.remaining_balance || 0,
            "Status Pembayaran": i.payment_status,
            "Sifat Biaya": i.ownership_type,
          })),
        },
      ];

      exportMultiSheet(sheets, `backup-data-seluruh-proyek-${new Date().toISOString().slice(0, 10)}`);
      setMessage("Semua data berhasil diexport ke Excel (Multi-Sheet)!");
    } catch (err) {
      console.error(err);
      setMessage("Gagal mengexport seluruh data.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Export Data & Backup Database"
          subtitle="Manajemen berkas cadangan dan export data operasional kantor"
        />

        {message && (
          <Card padding={3} style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-border-subtle)" }}>
            <Text size="sm" weight="medium" style={{ color: "var(--color-accent-600)" }}>{message}</Text>
          </Card>
        )}

        <Grid gap={4} columns={{ minWidth: 280, max: 2 }}>
          {/* Export Section */}
          <Card padding={4}>
            <VStack gap={3}>
              <Heading size="sm">📊 Export Data Laporan</Heading>
              <Text size="xs" color="secondary">
                Unduh seluruh data transaksi, master data, dan log pengiriman lapangan ke dalam format dokumen Excel (.xlsx) multilebar atau cetak laporan resmi.
              </Text>
              <Divider />
              <HStack gap={2}>
                <Button variant="primary" onPress={handleExportAll} isLoading={exporting}>
                  Export Semua Data (Excel)
                </Button>
                <Button variant="secondary" onPress={printToPDF}>
                  Cetak / Simpan PDF
                </Button>
              </HStack>
            </VStack>
          </Card>

          {/* Database Backup Section */}
          <Card padding={4}>
            <VStack gap={3}>
              <Heading size="sm">💾 Backup / Restore Database Lokal</Heading>
              <Text size="xs" color="secondary">
                Karena aplikasi ini menggunakan database SQLite lokal yang terisolasi di dalam komputer Anda, silakan lakukan backup secara berkala ke cloud drive atau flashdisk eksternal untuk menghindari kehilangan data.
              </Text>
              <Divider />
              <HStack gap={2}>
                <Button variant="primary" onPress={handleBackup} isLoading={backingUp}>
                  Buat File Backup (.db)
                </Button>
                <Button variant="secondary" onPress={handleRestore} isLoading={restoring} sentiment="negative">
                  Restore / Pulihkan Data
                </Button>
              </HStack>
            </VStack>
          </Card>
        </Grid>
      </VStack>
    </Section>
  );
}
