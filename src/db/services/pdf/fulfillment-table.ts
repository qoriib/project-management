import type jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import type { RequirementReportItem } from "../report.service";
import { calcRatio } from "@/utils/calc";
import { formatItemCode } from "@/utils/formatters";
import { PDF_COLORS, PDF_FONTS, PDF_PAGE, PDF_TABLE_STYLE } from "./styles";
import type { FulfillmentPdfContext } from "./types";
import { formatPercentage, formatQty, renderPdfKop } from "./utils";

interface ProcessedRowItem {
  number: number;
  itemCode: string;
  itemName: string;
  unit: string;
  plannedVol: string;
  orderedVol: string;
  orderPercentage: string;
  deliveredVol: string;
  remainingVol: string;
  deliveryPercentage: string;
}

/**
 * Merender Bagian Laporan Pemenuhan Volume (Orientasi Lanskap).
 */
export function renderFulfillmentVolumeSection(doc: jsPDF, context: FulfillmentPdfContext): void {
  const { project_name: projectName, company_name: companyName, period, data: fulfillmentItems } = context;

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = PDF_PAGE.margins.left;
  const marginRight = PDF_PAGE.margins.right;
  const printableWidth = pageWidth - marginLeft - marginRight;

  // 1. Render Kop Formal
  renderPdfKop(doc, {
    title: "LAPORAN PEMENUHAN (VOLUME)",
    projectName,
    companyName,
    period,
    pageWidth,
    startY: 16,
  });

  // 2. Pengelompokan Data per Kategori
  const categoryMap = new Map<string, { categoryId: string; items: RequirementReportItem[] }>();

  fulfillmentItems.forEach((item) => {
    const categoryName = (item.category || "LAINNYA").trim();
    const existingGroup = categoryMap.get(categoryName);

    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      categoryMap.set(categoryName, {
        categoryId: item.category_id || "\uffff",
        items: [item],
      });
    }
  });

  const sortedCategoryEntries = Array.from(categoryMap.entries());

  sortedCategoryEntries.sort(([nameA, groupA], [nameB, groupB]) => {
    const idComparison = groupA.categoryId.localeCompare(groupB.categoryId);
    if (idComparison !== 0) {
      return idComparison;
    }
    return nameA.localeCompare(nameB);
  });

  // 3. Akumulasi dan Pembentukan Baris Tabel
  let totalPlannedVolume = 0;
  let totalOrderedVolume = 0;
  let totalDeliveredVolume = 0;

  const tableBody: RowInput[] = [];
  let itemCounter = 1;

  for (const [categoryName, categoryGroup] of sortedCategoryEntries) {
    const categoryItems = categoryGroup.items;

    categoryItems.sort((firstItem, secondItem) => {
      const isFirstUnplanned = Boolean(firstItem.is_unplanned);
      const isSecondUnplanned = Boolean(secondItem.is_unplanned);

      if (isFirstUnplanned !== isSecondUnplanned) {
        return isFirstUnplanned ? 1 : -1;
      }

      return (firstItem.item_name || "").localeCompare(secondItem.item_name || "");
    });

    // Baris Header Kategori (Banner Spanning 10 Kolom)
    tableBody.push([
      {
        content: categoryName.toUpperCase(),
        colSpan: 10,
        styles: {
          fillColor: PDF_COLORS.categoryBg,
          textColor: PDF_COLORS.categoryText,
          fontStyle: "bold",
          halign: "left",
          fontSize: 7.5,
          lineWidth: PDF_TABLE_STYLE.borderWidth,
          lineColor: PDF_COLORS.borderDark,
          cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        },
      },
    ]);

    categoryItems.forEach((item) => {
      const plannedVolume = item.planned_volume || 0;
      const orderedVolume = item.total_ordered || 0;
      const deliveredVolume = item.total_delivered || 0;
      const remainingVolume = orderedVolume - deliveredVolume;

      const orderPercentage = calcRatio(orderedVolume, plannedVolume);
      const deliveryPercentage = calcRatio(deliveredVolume, orderedVolume);

      totalPlannedVolume += plannedVolume;
      totalOrderedVolume += orderedVolume;
      totalDeliveredVolume += deliveredVolume;

      const isVolumeOver = !item.is_unplanned && orderedVolume > plannedVolume && plannedVolume > 0;
      const isOrderPctOver = !item.is_unplanned && orderPercentage > 1.0;
      const isDeliveredOver =
        (orderedVolume > 0 && deliveredVolume > orderedVolume) ||
        (plannedVolume > 0 && deliveredVolume > plannedVolume);
      const isDeliveryPctOver = deliveryPercentage > 1.0;

      const itemCode = formatItemCode(item) || item.item_code || "-";
      const unit = item.unit || "-";

      const processedItem: ProcessedRowItem = {
        number: itemCounter,
        itemCode,
        itemName: item.item_name,
        unit,
        plannedVol: !item.is_unplanned && plannedVolume > 0 ? formatQty(plannedVolume) : "-",
        orderedVol: formatQty(orderedVolume),
        orderPercentage: formatPercentage(orderPercentage),
        deliveredVol: formatQty(deliveredVolume),
        remainingVol: formatQty(remainingVolume > 0 ? remainingVolume : 0),
        deliveryPercentage: formatPercentage(deliveryPercentage),
      };

      itemCounter += 1;

      // Sisipkan baris data dengan metadata status over per-sel di properti raw
      tableBody.push({
        _isUnplanned: Boolean(item.is_unplanned),
        _isVolumeOver: isVolumeOver,
        _isOrderPctOver: isOrderPctOver,
        _isDeliveredOver: isDeliveredOver,
        _isDeliveryPctOver: isDeliveryPctOver,
        0: processedItem.number,
        1: processedItem.itemCode,
        2: processedItem.itemName,
        3: processedItem.unit,
        4: processedItem.plannedVol,
        5: processedItem.orderedVol,
        6: processedItem.orderPercentage,
        7: processedItem.deliveredVol,
        8: processedItem.remainingVol,
        9: processedItem.deliveryPercentage,
      });
    });
  }

  // 4. Baris Total Keseluruhan
  const overallRemainingVolume = totalOrderedVolume - totalDeliveredVolume;
  const overallOrderPercentage = calcRatio(totalOrderedVolume, totalPlannedVolume);
  const overallDeliveryPercentage = calcRatio(totalDeliveredVolume, totalOrderedVolume);

  const totalRowCellStyle = {
    fontStyle: "bold" as const,
    fillColor: PDF_COLORS.totalBg,
    textColor: PDF_COLORS.totalText,
    lineWidth: PDF_TABLE_STYLE.borderWidth,
    lineColor: PDF_COLORS.borderDark,
  };

  const totalRow: RowInput = [
    {
      content: "TOTAL KESELURUHAN",
      colSpan: 4,
      styles: {
        ...totalRowCellStyle,
        halign: "right",
        fontSize: 7.5,
      },
    },
    {
      content: formatQty(totalPlannedVolume),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
    {
      content: formatQty(totalOrderedVolume),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
    {
      content: formatPercentage(overallOrderPercentage),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
    {
      content: formatQty(totalDeliveredVolume),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
    {
      content: formatQty(overallRemainingVolume > 0 ? overallRemainingVolume : 0),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
    {
      content: formatPercentage(overallDeliveryPercentage),
      styles: { ...totalRowCellStyle, halign: "right" },
    },
  ];

  tableBody.push(totalRow);

  // 5. Header Tabel 2-Tingkat
  const tableHead: RowInput[] = [
    [
      { content: "NO", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "KODE ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "NAMA ITEM", rowSpan: 2, styles: { halign: "left", valign: "middle" } },
      { content: "SATUAN", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
      { content: "KEBUTUHAN (BOM)", colSpan: 1, styles: { halign: "center" } },
      { content: "PEMESANAN (PO)", colSpan: 2, styles: { halign: "center" } },
      { content: "PENERIMAAN (NP)", colSpan: 3, styles: { halign: "center" } },
    ],
    [
      { content: "VOLUME", styles: { halign: "right" } },
      { content: "VOLUME", styles: { halign: "right" } },
      { content: "% ORDER", styles: { halign: "right" } },
      { content: "DATANG", styles: { halign: "right" } },
      { content: "SISA", styles: { halign: "right" } },
      { content: "% PEMENUHAN", styles: { halign: "right" } },
    ],
  ];

  // 6. Eksekusi Render autoTable Lanskap
  autoTable(doc, {
    startY: 27,
    margin: {
      top: 15,
      right: marginRight,
      bottom: 14,
      left: marginLeft,
    },
    head: tableHead,
    body: tableBody,
    theme: "plain",
    tableWidth: printableWidth,
    styles: {
      font: PDF_FONTS.primary,
      lineWidth: PDF_TABLE_STYLE.borderWidth,
      lineColor: PDF_COLORS.borderDark,
      textColor: PDF_COLORS.textDark,
    },
    headStyles: {
      fillColor: PDF_COLORS.tableHeaderBg,
      textColor: PDF_COLORS.tableHeaderText,
      fontSize: 7.2,
      fontStyle: "bold",
      lineWidth: PDF_TABLE_STYLE.borderWidth,
      lineColor: PDF_COLORS.borderDark,
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
    },
    bodyStyles: {
      fontSize: 7,
      lineWidth: PDF_TABLE_STYLE.borderWidth,
      lineColor: PDF_COLORS.borderDark,
      textColor: PDF_COLORS.textDark,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // NO
      1: { cellWidth: 24, halign: "center" }, // KODE ITEM
      2: { cellWidth: 85, halign: "left" }, // NAMA ITEM
      3: { cellWidth: 16, halign: "center" }, // SATUAN
      4: { cellWidth: 24, halign: "right" }, // BOM VOL
      5: { cellWidth: 24, halign: "right" }, // PO VOL
      6: { cellWidth: 20, halign: "right" }, // PO %
      7: { cellWidth: 22, halign: "right" }, // NP DATANG
      8: { cellWidth: 22, halign: "right" }, // NP SISA
      9: { cellWidth: 22, halign: "right" }, // NP %
    },
    didParseCell: (data) => {
      // Pastikan border styling selalu seragam di seluruh sel body
      if (data.section === "body") {
        data.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        data.cell.styles.lineColor = PDF_COLORS.borderDark;

        const rawRow = data.row.raw as Record<string, unknown>;
        const isUnplanned = Boolean(rawRow?._isUnplanned);
        const isVolumeOver = Boolean(rawRow?._isVolumeOver);
        const isOrderPctOver = Boolean(rawRow?._isOrderPctOver);
        const isDeliveredOver = Boolean(rawRow?._isDeliveredOver);
        const isDeliveryPctOver = Boolean(rawRow?._isDeliveryPctOver);

        const columnIndex = data.column.index;

        if (isUnplanned) {
          // Kolom Pemesanan (5, 6) dan Penerimaan (7, 9) pada item belanja di luar rencana
          if (columnIndex === 5 || columnIndex === 6 || columnIndex === 7 || columnIndex === 9) {
            data.cell.styles.fillColor = PDF_COLORS.unplannedCellBg;
          } else {
            data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          }
        } else {
          // Hanya sel yang berlebih (> 100% / over) yang diwarnai merah muda
          if (columnIndex === 5 && isVolumeOver) {
            data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
          } else if (columnIndex === 6 && isOrderPctOver) {
            data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
          } else if (columnIndex === 7 && isDeliveredOver) {
            data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
          } else if (columnIndex === 9 && isDeliveryPctOver) {
            data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
          } else {
            data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          }
        }
      }
    },
  });
}
