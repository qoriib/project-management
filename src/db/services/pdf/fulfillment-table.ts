import autoTable, { type RowInput } from "jspdf-autotable";
import { calcRatio } from "@/utils/calc";
import { formatItemCode } from "@/utils/formatters";
import {
  PDF_COLORS,
  PDF_FULFILLMENT_BODY_STYLES,
  PDF_FULFILLMENT_DATE_RANGE_COL_STYLES,
  PDF_FULFILLMENT_HEAD_STYLES,
  PDF_FULFILLMENT_STANDARD_COL_STYLES,
  PDF_PAGE_LANDSCAPE,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_CATEGORY_BANNER_STYLES,
  PDF_TABLE_STYLE,
  PDF_TABLE_TOTAL_LABEL_STYLES,
  PDF_TABLE_TOTAL_ROW_STYLES,
} from "./styles";
import { formatPercentage, formatQty, renderPdfKop } from "./utils";
import type jsPDF from "jspdf";
import type { FulfillmentPdfContext } from "./types";

export function renderFulfillmentVolumeSection(doc: jsPDF, context: FulfillmentPdfContext): void {
  const {
    project_name: projectName,
    company_name: companyName,
    period,
    data: fulfillmentItems,
    hasDateRange,
  } = context;

  const { margins, printableWidth, kopStartY, tableStartY } = PDF_PAGE_LANDSCAPE;

  // Render Kop Formal
  renderPdfKop(doc, {
    title: "LAPORAN PEMENUHAN",
    projectName,
    companyName,
    period,
    pageWidth: doc.internal.pageSize.getWidth(),
    startY: kopStartY,
  });

  // Pengelompokan Data per Kategori
  const categoryMap = new Map<string, { categoryId: string; items: typeof fulfillmentItems }>();

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

  // Akumulasi dan Pembentukan Baris Tabel
  let totalPlannedVolume = 0;
  let totalOrderedVolume = 0;
  let totalPeriodOrderedVolume = 0;
  let totalDeliveredVolume = 0;
  let totalPeriodDeliveredVolume = 0;

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

    // Baris Header Kategori
    tableBody.push([
      {
        content: categoryName.toUpperCase(),
        colSpan: hasDateRange ? 11 : 9,
        styles: PDF_TABLE_CATEGORY_BANNER_STYLES,
      },
    ]);

    categoryItems.forEach((item) => {
      const plannedVolume = item.planned_volume || 0;
      const cumulativeOrdered = item.cumulative_ordered ?? item.total_ordered ?? 0;
      const periodOrdered = item.period_ordered ?? 0;
      const cumulativeDelivered = item.cumulative_delivered ?? item.total_delivered ?? 0;
      const periodDelivered = item.period_delivered ?? 0;

      // Volume perhitungan persentase selalu konsisten didapatkan dari volume kumulatif
      const orderedVolume = cumulativeOrdered;
      const deliveredVolume = cumulativeDelivered;

      // % Pengadaan dihitung dari: (Kumulatif PO / BOQ)
      const orderPercentage = calcRatio(orderedVolume, plannedVolume);
      // % Pemenuhan dihitung dari: (Kumulatif NP / Kumulatif PO)
      const deliveryPercentage = calcRatio(deliveredVolume, orderedVolume);

      totalPlannedVolume += plannedVolume;
      totalOrderedVolume += orderedVolume;
      totalPeriodOrderedVolume += periodOrdered;
      totalDeliveredVolume += deliveredVolume;
      totalPeriodDeliveredVolume += periodDelivered;

      const isVolumeOver = !item.is_unplanned && orderedVolume > plannedVolume && plannedVolume > 0;
      const isVolumeUnder = !item.is_unplanned && orderedVolume > 0 && orderedVolume < plannedVolume;

      const isOrderPctOver = !item.is_unplanned && orderPercentage > 1.0;
      const isOrderPctUnder = !item.is_unplanned && orderPercentage < 1.0 && orderedVolume > 0;

      const isDeliveredOver =
        (orderedVolume > 0 && deliveredVolume > orderedVolume) ||
        (plannedVolume > 0 && deliveredVolume > plannedVolume);
      const isDeliveredUnder = orderedVolume > 0 && deliveredVolume > 0 && deliveredVolume < orderedVolume;

      const isDeliveryPctOver = deliveryPercentage > 1.0;
      const isDeliveryPctUnder = deliveryPercentage < 1.0 && deliveredVolume > 0;

      const itemCode = formatItemCode(item) || item.item_code || "-";
      const unit = item.unit || "-";
      const plannedVolDisplay = !item.is_unplanned && plannedVolume > 0 ? formatQty(plannedVolume) : "-";

      if (hasDateRange) {
        tableBody.push({
          _isUnplanned: Boolean(item.is_unplanned),
          _isVolumeOver: isVolumeOver,
          _isVolumeUnder: isVolumeUnder,
          _isOrderPctOver: isOrderPctOver,
          _isOrderPctUnder: isOrderPctUnder,
          _isDeliveredOver: isDeliveredOver,
          _isDeliveredUnder: isDeliveredUnder,
          _isDeliveryPctOver: isDeliveryPctOver,
          _isDeliveryPctUnder: isDeliveryPctUnder,
          0: itemCounter,
          1: itemCode,
          2: item.item_name,
          3: unit,
          4: plannedVolDisplay,
          5: formatQty(periodOrdered),
          6: formatQty(cumulativeOrdered),
          7: formatPercentage(orderPercentage),
          8: formatQty(periodDelivered),
          9: formatQty(cumulativeDelivered),
          10: formatPercentage(deliveryPercentage),
        });
      } else {
        tableBody.push({
          _isUnplanned: Boolean(item.is_unplanned),
          _isVolumeOver: isVolumeOver,
          _isVolumeUnder: isVolumeUnder,
          _isOrderPctOver: isOrderPctOver,
          _isOrderPctUnder: isOrderPctUnder,
          _isDeliveredOver: isDeliveredOver,
          _isDeliveredUnder: isDeliveredUnder,
          _isDeliveryPctOver: isDeliveryPctOver,
          _isDeliveryPctUnder: isDeliveryPctUnder,
          0: itemCounter,
          1: itemCode,
          2: item.item_name,
          3: unit,
          4: plannedVolDisplay,
          5: formatQty(orderedVolume),
          6: formatPercentage(orderPercentage),
          7: formatQty(deliveredVolume),
          8: formatPercentage(deliveryPercentage),
        });
      }

      itemCounter += 1;
    });
  }

  // Baris Total Keseluruhan
  const overallOrderPercentage = calcRatio(totalOrderedVolume, totalPlannedVolume);
  const overallDeliveryPercentage = calcRatio(totalDeliveredVolume, totalOrderedVolume);

  const totalRowCellStyle = PDF_TABLE_TOTAL_ROW_STYLES;

  const totalRow: RowInput = hasDateRange
    ? [
        {
          content: "TOTAL",
          colSpan: 4,
          styles: PDF_TABLE_TOTAL_LABEL_STYLES,
        },
        {
          content: formatQty(totalPlannedVolume),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
        {
          content: formatQty(totalPeriodOrderedVolume),
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
          content: formatQty(totalPeriodDeliveredVolume),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
        {
          content: formatQty(totalDeliveredVolume),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
        {
          content: formatPercentage(overallDeliveryPercentage),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
      ]
    : [
        {
          content: "TOTAL",
          colSpan: 4,
          styles: PDF_TABLE_TOTAL_LABEL_STYLES,
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
          content: formatPercentage(overallDeliveryPercentage),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
      ];

  tableBody.push(totalRow);

  // Header Tabel 2-Tingkat
  const tableHead: RowInput[] = hasDateRange
    ? [
        [
          { content: "NO", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KODE ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "NAMA ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "SATUAN", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KEBUTUHAN", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "PENGADAAN", colSpan: 3, styles: { halign: "center", valign: "middle" } },
          { content: "PENERIMAAN", colSpan: 3, styles: { halign: "center", valign: "middle" } },
        ],
        [
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "VOL. KUM", styles: { halign: "center" } },
          { content: "%", styles: { halign: "center" } },
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "VOL. KUM", styles: { halign: "center" } },
          { content: "%", styles: { halign: "center" } },
        ],
      ]
    : [
        [
          { content: "NO", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KODE ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "NAMA ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "SATUAN", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KEBUTUHAN", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "PENGADAAN", colSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "PENERIMAAN", colSpan: 2, styles: { halign: "center", valign: "middle" } },
        ],
        [
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "%", styles: { halign: "center" } },
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "%", styles: { halign: "center" } },
        ],
      ];

  const columnStyles = hasDateRange ? PDF_FULFILLMENT_DATE_RANGE_COL_STYLES : PDF_FULFILLMENT_STANDARD_COL_STYLES;

  // Eksekusi Render autoTable Lanskap
  autoTable(doc, {
    theme: "plain",
    startY: tableStartY,
    margin: margins,
    head: tableHead,
    body: tableBody,
    tableWidth: printableWidth,
    styles: {
      ...PDF_TABLE_BASE_STYLES,
    },
    headStyles: PDF_FULFILLMENT_HEAD_STYLES,
    bodyStyles: PDF_FULFILLMENT_BODY_STYLES,
    columnStyles,
    didParseCell: (data) => {
      // Pastikan seluruh header selalu horizontal align center dan vertical align middle
      if (data.section === "head") {
        data.cell.styles.halign = PDF_TABLE_STYLE.headerHalign;
        data.cell.styles.valign = PDF_TABLE_STYLE.headerValign;
      }

      // Pastikan border styling dan vertical align selalu seragam di seluruh sel body
      if (data.section === "body") {
        data.cell.styles.valign = PDF_TABLE_STYLE.valign;
        data.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        data.cell.styles.lineColor = PDF_COLORS.borderDark;

        const rawRow = data.row.raw as Record<string, unknown>;
        const isUnplanned = Boolean(rawRow?._isUnplanned);
        const isVolumeOver = Boolean(rawRow?._isVolumeOver);
        const isVolumeUnder = Boolean(rawRow?._isVolumeUnder);
        const isOrderPctOver = Boolean(rawRow?._isOrderPctOver);
        const isOrderPctUnder = Boolean(rawRow?._isOrderPctUnder);
        const isDeliveredOver = Boolean(rawRow?._isDeliveredOver);
        const isDeliveredUnder = Boolean(rawRow?._isDeliveredUnder);
        const isDeliveryPctOver = Boolean(rawRow?._isDeliveryPctOver);
        const isDeliveryPctUnder = Boolean(rawRow?._isDeliveryPctUnder);

        const columnIndex = data.column.index;

        if (isUnplanned) {
          // Seluruh baris diwarnai kuning untuk item di luar rencana (unplanned)
          data.cell.styles.fillColor = PDF_COLORS.unplannedCellBg;
        } else if (hasDateRange) {
          if (columnIndex === 6) {
            if (isVolumeOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isVolumeUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 7) {
            if (isOrderPctOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isOrderPctUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 9) {
            if (isDeliveredOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isDeliveredUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 10) {
            if (isDeliveryPctOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isDeliveryPctUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else {
            data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          }
        } else {
          // Sel PO & NP: merah jika over (> 100%), hijau jika under (< 100% / parsial)
          if (columnIndex === 5) {
            if (isVolumeOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isVolumeUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 6) {
            if (isOrderPctOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isOrderPctUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 7) {
            if (isDeliveredOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isDeliveredUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else if (columnIndex === 8) {
            if (isDeliveryPctOver) data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            else if (isDeliveryPctUnder) data.cell.styles.fillColor = PDF_COLORS.budgetUnderCellBg;
            else data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          } else {
            data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
          }
        }
      }
    },
  });
}
