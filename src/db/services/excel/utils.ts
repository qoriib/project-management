import type * as ExcelJS from "exceljs";
import {
  ALIGN_CENTER,
  ALIGN_HEADER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  BORDER_ALL_THIN,
  BORDER_KOP_SEPARATOR,
  EXCEL_ROW_HEIGHT,
  FILL_TABLE_HEADER,
  FILL_TOTAL_ROW,
  FONT_KOP_AGENCY,
  FONT_KOP_SUBTITLE,
  FONT_KOP_TITLE,
  FONT_REGULAR,
  FONT_TABLE_HEADER,
  FONT_TOTAL_ROW,
} from "./styles";

export interface SheetColumnConfig {
  header: string;
  key: string;
  width: number;
  align?: "left" | "center" | "right";
  numFmt?: string;
}

interface FormalKopOptions {
  company_name: string;
  title: string;
  subtitle: string;
  endCol: string;
  endColIdx: number;
  startCol?: string;
  startColIdx?: number;
}

/**
 * Creates a formal Kop (Letterhead / Document Header) across specified columns in grayscale.
 */
export function createFormalKop(worksheet: ExcelJS.Worksheet, options: FormalKopOptions): void {
  const startColumn = options.startCol ?? "A";
  const startColumnIndex = options.startColIdx ?? 1;
  const endColumn = options.endCol;
  const endColumnIndex = options.endColIdx;

  // Baris 1: Nama Instansi / Perusahaan
  worksheet.mergeCells(`${startColumn}1:${endColumn}1`);
  const agencyNameCell = worksheet.getCell(`${startColumn}1`);
  agencyNameCell.value = options.company_name.toUpperCase();
  agencyNameCell.font = FONT_KOP_AGENCY;
  agencyNameCell.alignment = ALIGN_CENTER;
  worksheet.getRow(1).height = EXCEL_ROW_HEIGHT.kopAgency;

  // Baris 2: Judul Laporan
  worksheet.mergeCells(`${startColumn}2:${endColumn}2`);
  const reportTitleCell = worksheet.getCell(`${startColumn}2`);
  reportTitleCell.value = options.title;
  reportTitleCell.font = FONT_KOP_TITLE;
  reportTitleCell.alignment = ALIGN_CENTER;
  worksheet.getRow(2).height = EXCEL_ROW_HEIGHT.kopTitle;

  // Baris 3: Subtitle / Metadata (Proyek, Tahun Anggaran, Periode)
  worksheet.mergeCells(`${startColumn}3:${endColumn}3`);
  const subtitleCell = worksheet.getCell(`${startColumn}3`);
  subtitleCell.value = options.subtitle;
  subtitleCell.font = FONT_KOP_SUBTITLE;
  subtitleCell.alignment = ALIGN_CENTER;
  worksheet.getRow(3).height = EXCEL_ROW_HEIGHT.kopSubtitle;

  // Border garis pemisah bawah pada Baris 3
  for (let columnIndex = startColumnIndex; columnIndex <= endColumnIndex; columnIndex++) {
    const separatorCell = worksheet.getRow(3).getCell(columnIndex);
    separatorCell.border = BORDER_KOP_SEPARATOR;
  }

  // Baris 4: Spacer kosong
  worksheet.getRow(4).height = EXCEL_ROW_HEIGHT.kopSpacer;
}

/**
 * Standard table column header renderer at a given row (default row 5).
 */
export function renderTableHeaderRow(worksheet: ExcelJS.Worksheet, columns: SheetColumnConfig[], rowNumber = 5): void {
  const headerRow = worksheet.getRow(rowNumber);
  headerRow.height = EXCEL_ROW_HEIGHT.tableHeader;

  columns.forEach((columnConfig, columnIndex) => {
    const targetCell = headerRow.getCell(columnIndex + 1);

    targetCell.value = columnConfig.header;
    targetCell.font = FONT_TABLE_HEADER;
    targetCell.fill = FILL_TABLE_HEADER;
    targetCell.alignment = ALIGN_HEADER;
    targetCell.border = BORDER_ALL_THIN;
  });
}

/**
 * Applies standard body row cell styling (border, font, alignment, numFmt) driven by COLUMNS config.
 */
export function styleBodyRow(row: ExcelJS.Row, columns: SheetColumnConfig[], backgroundFill?: ExcelJS.Fill): void {
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    const columnConfig = columns[columnNumber - 1];

    cell.border = BORDER_ALL_LIGHT;
    cell.font = FONT_REGULAR;

    if (backgroundFill) {
      cell.fill = backgroundFill;
    }

    if (columnConfig?.align === "center") {
      cell.alignment = ALIGN_CENTER;
    } else if (columnConfig?.align === "left") {
      cell.alignment = ALIGN_LEFT;
    } else {
      cell.alignment = ALIGN_RIGHT;
    }

    if (columnConfig?.numFmt) {
      cell.numFmt = columnConfig.numFmt;
    }
  });
}

/**
 * Applies standard total row cell styling (bold font, fill, double-bottom border, numFmt) driven by COLUMNS config.
 * Col 2 is always center-aligned (merged label cell convention).
 */
export function styleTotalRow(row: ExcelJS.Row, columns: SheetColumnConfig[]): void {
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    const columnConfig = columns[columnNumber - 1];

    cell.font = FONT_TOTAL_ROW;
    cell.fill = FILL_TOTAL_ROW;
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (columnNumber === 2) {
      cell.alignment = ALIGN_CENTER;
    } else if (columnConfig?.numFmt) {
      cell.numFmt = columnConfig.numFmt;
      cell.alignment = ALIGN_RIGHT;
    }
  });
}
