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

/**
 * Merender Bagian Laporan Pemenuhan Volume (Orientasi Lanskap).
 */
export function renderFulfillmentVolumeSection(doc: jsPDF, context: FulfillmentPdfContext): void {
  const {
    project_name: projectName,
    company_name: companyName,
    period,
    data: fulfillmentItems,
    hasDateRange,
  } = context;

  const { margins, printableWidth, kopStartY, tableStartY } = PDF_PAGE_LANDSCAPE;

  // 1. Render Kop Formal
  renderPdfKop(doc, {
    title: "LAPORAN PEMENUHAN",
    projectName,
    companyName,
    period,
    pageWidth: doc.internal.pageSize.getWidth(),
    startY: kopStartY,
  });

  // 2. Pengelompokan Data per Kategori
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

  // 3. Akumulasi dan Pembentukan Baris Tabel
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

    // Baris Header Kategori (Banner Spanning 12 Kolom jika hasDateRange, 10 Kolom jika standar)
    tableBody.push([
      {
        content: categoryName.toUpperCase(),
        colSpan: hasDateRange ? 12 : 10,
        styles: PDF_TABLE_CATEGORY_BANNER_STYLES,
      },
    ]);

    categoryItems.forEach((item) => {
      const plannedVolume = item.planned_volume || 0;
      const cumulativeOrdered = item.cumulative_ordered ?? item.total_ordered ?? 0;
      const periodOrdered = item.period_ordered ?? 0;
      const cumulativeDelivered = item.cumulative_delivered ?? item.total_delivered ?? 0;
      const periodDelivered = item.period_delivered ?? 0;

      const orderedVolume = hasDateRange ? cumulativeOrdered : item.total_ordered || 0;
      const deliveredVolume = hasDateRange ? cumulativeDelivered : item.total_delivered || 0;
      const remainingVolume = orderedVolume - deliveredVolume;

      const orderPercentage = calcRatio(orderedVolume, plannedVolume);
      const deliveryPercentage = calcRatio(deliveredVolume, orderedVolume);

      totalPlannedVolume += plannedVolume;
      totalOrderedVolume += orderedVolume;
      totalPeriodOrderedVolume += periodOrdered;
      totalDeliveredVolume += deliveredVolume;
      totalPeriodDeliveredVolume += periodDelivered;

      const isVolumeOver = !item.is_unplanned && orderedVolume > plannedVolume && plannedVolume > 0;
      const isOrderPctOver = !item.is_unplanned && orderPercentage > 1.0;
      const isDeliveredOver =
        (orderedVolume > 0 && deliveredVolume > orderedVolume) ||
        (plannedVolume > 0 && deliveredVolume > plannedVolume);
      const isDeliveryPctOver = deliveryPercentage > 1.0;

      const itemCode = formatItemCode(item) || item.item_code || "-";
      const unit = item.unit || "-";
      const plannedVolDisplay = !item.is_unplanned && plannedVolume > 0 ? formatQty(plannedVolume) : "-";

      if (hasDateRange) {
        tableBody.push({
          _isUnplanned: Boolean(item.is_unplanned),
          _isVolumeOver: isVolumeOver,
          _isOrderPctOver: isOrderPctOver,
          _isDeliveredOver: isDeliveredOver,
          _isDeliveryPctOver: isDeliveryPctOver,
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
          10: formatQty(remainingVolume > 0 ? remainingVolume : 0),
          11: formatPercentage(deliveryPercentage),
        });
      } else {
        tableBody.push({
          _isUnplanned: Boolean(item.is_unplanned),
          _isVolumeOver: isVolumeOver,
          _isOrderPctOver: isOrderPctOver,
          _isDeliveredOver: isDeliveredOver,
          _isDeliveryPctOver: isDeliveryPctOver,
          0: itemCounter,
          1: itemCode,
          2: item.item_name,
          3: unit,
          4: plannedVolDisplay,
          5: formatQty(orderedVolume),
          6: formatPercentage(orderPercentage),
          7: formatQty(deliveredVolume),
          8: formatQty(remainingVolume > 0 ? remainingVolume : 0),
          9: formatPercentage(deliveryPercentage),
        });
      }

      itemCounter += 1;
    });
  }

  // 4. Baris Total Keseluruhan
  const overallRemainingVolume = totalOrderedVolume - totalDeliveredVolume;
  const overallOrderPercentage = calcRatio(totalOrderedVolume, totalPlannedVolume);
  const overallDeliveryPercentage = calcRatio(totalDeliveredVolume, totalOrderedVolume);

  const totalRowCellStyle = PDF_TABLE_TOTAL_ROW_STYLES;

  const totalRow: RowInput = hasDateRange
    ? [
        {
          content: "TOTAL KESELURUHAN",
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
          content: formatQty(overallRemainingVolume > 0 ? overallRemainingVolume : 0),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
        {
          content: formatPercentage(overallDeliveryPercentage),
          styles: { ...totalRowCellStyle, halign: "right" },
        },
      ]
    : [
        {
          content: "TOTAL KESELURUHAN",
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
  const tableHead: RowInput[] = hasDateRange
    ? [
        [
          { content: "NO", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KODE ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "NAMA ITEM", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "SATUAN", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
          { content: "KEBUTUHAN", colSpan: 1, styles: { halign: "center", valign: "middle" } },
          { content: "PENGADAAN", colSpan: 3, styles: { halign: "center", valign: "middle" } },
          { content: "PENERIMAAN", colSpan: 4, styles: { halign: "center", valign: "middle" } },
        ],
        [
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "PERIODE", styles: { halign: "center" } },
          { content: "KUMULATIF", styles: { halign: "center" } },
          { content: "% PENGADAAN", styles: { halign: "center" } },
          { content: "PERIODE", styles: { halign: "center" } },
          { content: "KUMULATIF", styles: { halign: "center" } },
          { content: "SISA", styles: { halign: "center" } },
          { content: "% PEMENUHAN", styles: { halign: "center" } },
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
          { content: "PENERIMAAN", colSpan: 3, styles: { halign: "center", valign: "middle" } },
        ],
        [
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "VOLUME", styles: { halign: "center" } },
          { content: "% ORDER", styles: { halign: "center" } },
          { content: "DATANG", styles: { halign: "center" } },
          { content: "SISA", styles: { halign: "center" } },
          { content: "% PEMENUHAN", styles: { halign: "center" } },
        ],
      ];

  const columnStyles = hasDateRange ? PDF_FULFILLMENT_DATE_RANGE_COL_STYLES : PDF_FULFILLMENT_STANDARD_COL_STYLES;

  // 6. Eksekusi Render autoTable Lanskap
  autoTable(doc, {
    startY: tableStartY,
    margin: margins,
    head: tableHead,
    body: tableBody,
    theme: "plain",
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
        const isOrderPctOver = Boolean(rawRow?._isOrderPctOver);
        const isDeliveredOver = Boolean(rawRow?._isDeliveredOver);
        const isDeliveryPctOver = Boolean(rawRow?._isDeliveryPctOver);

        const columnIndex = data.column.index;

        if (hasDateRange) {
          if (isUnplanned) {
            if (
              columnIndex === 5 ||
              columnIndex === 6 ||
              columnIndex === 7 ||
              columnIndex === 8 ||
              columnIndex === 9 ||
              columnIndex === 11
            ) {
              data.cell.styles.fillColor = PDF_COLORS.unplannedCellBg;
            } else {
              data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
            }
          } else {
            if (columnIndex === 6 && isVolumeOver) {
              data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            } else if (columnIndex === 7 && isOrderPctOver) {
              data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            } else if (columnIndex === 9 && isDeliveredOver) {
              data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            } else if (columnIndex === 11 && isDeliveryPctOver) {
              data.cell.styles.fillColor = PDF_COLORS.budgetOverCellBg;
            } else {
              data.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
            }
          }
        } else {
          if (isUnplanned) {
            // Kolom Pengadaan (5, 6) dan Penerimaan (7, 9) pada item belanja di luar rencana
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
      }
    },
  });
}
