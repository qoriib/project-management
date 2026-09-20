import * as ExcelJS from "exceljs";
import { NotFoundError, wrapDbError } from "@/db/core/errors";
import { orderRepo, projectRepo } from "@/db/repositories";
import { formatDate, formatNumber } from "@/utils/formatters";
import type { GenerateAssetRequestOptions, OrderPdfItem } from "../pdf/order-pdf-types";

export interface AssetRequestExcelContext {
  company_line: string;
  company_name?: string;
  project_name: string;
  group_name?: string;
  fiscal_year: number | string;
  document_code: string;
  items: OrderPdfItem[];
  location: string;
  date_display: string;
  remarks: string;
}

export function createAssetRequestSheet(
  workbook: ExcelJS.Workbook,
  context: AssetRequestExcelContext,
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet("Form Permintaan", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      margins: {
        left: 0.5,
        right: 0.5,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    },
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { key: "A", width: 6 },
    { key: "B", width: 34 },
    { key: "C", width: 14 },
    { key: "D", width: 10 },
    { key: "E", width: 12 },
    { key: "F", width: 24 },
  ];

  const fontDefault = { name: "Arial", size: 9 };
  const fontBold = { name: "Arial", size: 9, bold: true };
  const fontTitle = { name: "Arial", size: 14, bold: true, color: { argb: "FFC0392B" }, underline: true };
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  // Header Blok Kiri
  worksheet.getCell("A1").value = context.company_line;
  worksheet.getCell("A1").font = fontBold;

  worksheet.getCell("A2").value = "No.";
  worksheet.getCell("A2").font = fontDefault;
  worksheet.getCell("B2").value = ":";
  worksheet.getCell("B2").font = fontDefault;

  worksheet.getCell("A3").value = "Nama Proyek";
  worksheet.getCell("A3").font = fontDefault;
  worksheet.getCell("B3").value = `: ${context.project_name}`;
  worksheet.getCell("B3").font = fontDefault;

  worksheet.getCell("B4").value = `TA. ${context.fiscal_year}`;
  worksheet.getCell("B4").font = fontDefault;

  if (context.company_name) {
    worksheet.getCell("B5").value = context.company_name;
    worksheet.getCell("B5").font = fontDefault;
  }

  // Header Blok Kanan
  worksheet.getCell("E2").value = "Kepada Yth :";
  worksheet.getCell("E2").font = fontDefault;
  worksheet.getCell("E3").value = "Kadiv Proyek";
  worksheet.getCell("E3").font = fontDefault;
  worksheet.getCell("E4").value = "Di_";
  worksheet.getCell("E4").font = fontDefault;
  worksheet.getCell("F5").value = "Kantor Pusat";
  worksheet.getCell("F5").font = fontDefault;
  worksheet.getCell("F5").alignment = { horizontal: "right" };

  // Judul Dokumen
  worksheet.mergeCells("A7:F7");
  const titleCell = worksheet.getCell("A7");
  titleCell.value = "FORM PERMINTAAN BARANG/ALAT";
  titleCell.font = fontTitle;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("A8:F8");
  const docCodeCell = worksheet.getCell("A8");
  docCodeCell.value = `No.   : ${context.document_code || "...................."}`;
  docCodeCell.font = fontDefault;
  docCodeCell.alignment = { horizontal: "center", vertical: "middle" };

  // Tabel Header (Row 10)
  const headerRow = worksheet.getRow(10);
  headerRow.values = ["No.", "NAMA BARANG", "KODE RAPP", "SATUAN", "JUMLAH", "KETERANGAN"];
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = fontBold;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFBED49B" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = borderThin;
  });

  // Tabel Body (Row 11 s.d. 20, min 10 rows)
  const startRow = 11;
  const totalRows = Math.max(context.items.length, 10);

  for (let i = 0; i < totalRows; i++) {
    const rowNum = startRow + i;
    const row = worksheet.getRow(rowNum);
    const item = context.items[i];

    row.height = 18;
    if (item) {
      row.getCell("A").value = item.no;
      row.getCell("B").value = item.name_with_price || (item as { name?: string }).name || "";
      row.getCell("C").value = item.item_code ?? "";
      row.getCell("D").value = item.unit ?? "";
      row.getCell("E").value = item.qty_display;
    } else {
      row.getCell("A").value = "";
      row.getCell("B").value = "";
      row.getCell("C").value = "";
      row.getCell("D").value = "";
      row.getCell("E").value = "";
    }

    row.getCell("A").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("B").alignment = { horizontal: "left", vertical: "middle" };
    row.getCell("C").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("D").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("E").alignment = { horizontal: "center", vertical: "middle" };

    row.getCell("A").font = fontDefault;
    row.getCell("B").font = fontDefault;
    row.getCell("C").font = fontDefault;
    row.getCell("D").font = fontDefault;
    row.getCell("E").font = fontDefault;

    row.getCell("A").border = borderThin;
    row.getCell("B").border = borderThin;
    row.getCell("C").border = borderThin;
    row.getCell("D").border = borderThin;
    row.getCell("E").border = borderThin;
    row.getCell("F").border = borderThin;
  }

  // Kolom KETERANGAN (F11 s.d. F[startRow + totalRows - 1]) di-merge jadi 1 cell utuh
  const endRow = startRow + totalRows - 1;
  worksheet.mergeCells(`F${startRow}:F${endRow}`);
  const ketCell = worksheet.getCell(`F${startRow}`);
  ketCell.value = context.remarks || "";
  ketCell.font = fontDefault;
  ketCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };

  // Footer File Ref
  const refRow = endRow + 1;
  worksheet.getCell(`A${refRow}`).value = "/asset/form permintaan barang.xls";
  worksheet.getCell(`A${refRow}`).font = { name: "Arial", size: 8, italic: true };

  // Footer Signatures
  const signDateRow = refRow + 2;
  worksheet.mergeCells(`A${signDateRow}:F${signDateRow}`);
  const dateCell = worksheet.getCell(`A${signDateRow}`);
  dateCell.value = `${context.location}, ${context.date_display}`;
  dateCell.font = fontDefault;
  dateCell.alignment = { horizontal: "center" };

  const signRoleRow = signDateRow + 1;
  worksheet.mergeCells(`A${signRoleRow}:B${signRoleRow}`);
  worksheet.getCell(`A${signRoleRow}`).value = "Diajukan Oleh,";
  worksheet.getCell(`A${signRoleRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`A${signRoleRow}`).font = fontDefault;

  worksheet.mergeCells(`C${signRoleRow}:D${signRoleRow}`);
  worksheet.getCell(`C${signRoleRow}`).value = "Diperiksa Oleh,";
  worksheet.getCell(`C${signRoleRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`C${signRoleRow}`).font = fontDefault;

  worksheet.mergeCells(`E${signRoleRow}:F${signRoleRow}`);
  worksheet.getCell(`E${signRoleRow}`).value = "Disetujui Oleh,";
  worksheet.getCell(`E${signRoleRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`E${signRoleRow}`).font = fontDefault;

  const signNameRow = signRoleRow + 4;
  worksheet.mergeCells(`A${signNameRow}:B${signNameRow}`);
  worksheet.getCell(`A${signNameRow}`).value = "Mila";
  worksheet.getCell(`A${signNameRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`A${signNameRow}`).font = { ...fontBold, underline: true };

  worksheet.mergeCells(`C${signNameRow}:D${signNameRow}`);
  worksheet.getCell(`C${signNameRow}`).value = "Andries H Palenteng";
  worksheet.getCell(`C${signNameRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`C${signNameRow}`).font = { ...fontBold, underline: true };

  worksheet.mergeCells(`E${signNameRow}:F${signNameRow}`);
  worksheet.getCell(`E${signNameRow}`).value = "Ismail Ali Usman";
  worksheet.getCell(`E${signNameRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`E${signNameRow}`).font = { ...fontBold, underline: true };

  const signPosRow = signNameRow + 1;
  worksheet.mergeCells(`A${signPosRow}:B${signPosRow}`);
  worksheet.getCell(`A${signPosRow}`).value = "Adm Logistik";
  worksheet.getCell(`A${signPosRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`A${signPosRow}`).font = fontDefault;

  worksheet.mergeCells(`C${signPosRow}:D${signPosRow}`);
  worksheet.getCell(`C${signPosRow}`).value = "Kadiv Proyek";
  worksheet.getCell(`C${signPosRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`C${signPosRow}`).font = fontDefault;

  worksheet.mergeCells(`E${signPosRow}:F${signPosRow}`);
  worksheet.getCell(`E${signPosRow}`).value = "Div. II Busdev, Anggaran & Pengendalian";
  worksheet.getCell(`E${signPosRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`E${signPosRow}`).font = fontDefault;

  return worksheet;
}

export async function generateAssetRequestExcel(
  orderId: string,
  options: GenerateAssetRequestOptions,
): Promise<Uint8Array> {
  try {
    const order = await orderRepo.findByIdWithSummary(orderId);
    if (!order) {
      throw new NotFoundError("orders", orderId);
    }

    const items = await orderRepo.findItems(orderId);
    const project = await projectRepo.findById(order.project_id);

    const pdfItems: OrderPdfItem[] = items.map((item, index) => ({
      no: index + 1,
      name_with_price: item.item_name ?? "-",
      qty_display: formatNumber(item.qty, "volume"),
      unit: item.unit ?? "-",
      item_code: item.item_code ?? "-",
    }));

    const now = new Date();
    const groupName = order.group_name || items[0]?.group_name;
    const projectName = groupName ? `${project?.project_name ?? "-"} (${groupName})` : (project?.project_name ?? "-");

    const context: AssetRequestExcelContext = {
      company_line: "CIVIL ENGINEERING & GENERAL CONTRACTORS",
      company_name: project?.company_name ?? "-",
      project_name: projectName,
      group_name: groupName ?? undefined,
      fiscal_year: project?.fiscal_year ?? "-",
      document_code: options.documentCode?.trim() || order.order_code || "....................",
      items: pdfItems,
      location: "Bandar Lampung",
      date_display: formatDate(now),
      remarks: options.remarks?.trim() ?? "",
    };

    const workbook = new ExcelJS.Workbook();
    createAssetRequestSheet(workbook, context);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw wrapDbError(error, "asset_request_excel");
  }
}
