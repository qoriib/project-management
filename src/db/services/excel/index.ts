import * as ExcelJS from "exceljs";
import {
  getRequirementReport,
  getProjectRequirementReport,
  getProjectOrderReport,
  getProjectReceiptReport,
} from "../report.service";
import { projectRepo } from "@/db/repositories";
import { createExecutiveSummarySheet } from "./summary-sheet";
import { createFulfillmentSheet } from "./fulfillment-sheet";
import { createRequirementSheet } from "./requirement-sheet";
import { createOrderSheet } from "./order-sheet";
import { createReceiptSheet } from "./receipt-sheet";

export * from "./types";
export * from "./styles";
export { createExecutiveSummarySheet } from "./summary-sheet";
export { createFulfillmentSheet } from "./fulfillment-sheet";
export { createRequirementSheet } from "./requirement-sheet";
export { createOrderSheet } from "./order-sheet";
export { createReceiptSheet } from "./receipt-sheet";

/**
 * Generates a formal institutional standard multi-sheet Excel report.
 */
export async function generateRequirementReportExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [project, data, requirementData, orderData, receiptData] = await Promise.all([
    projectRepo.findById(projectId),
    getRequirementReport(projectId, startDate, endDate),
    getProjectRequirementReport(projectId),
    getProjectOrderReport(projectId, startDate, endDate),
    getProjectReceiptReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = project?.company_name ?? "Sistem Manajemen Proyek";
  workbook.created = new Date();

  const projectName = project?.project_name ?? "Proyek";
  const companyName = project?.company_name ?? "Instansi / Perusahaan";
  const fiscalYear = project?.fiscal_year ? String(project.fiscal_year) : new Date().getFullYear().toString();
  const periodStr =
    startDate && endDate
      ? `${startDate} s/d ${endDate}`
      : startDate
        ? `Mulai ${startDate}`
        : endDate
          ? `Sampai ${endDate}`
          : "Semua Periode";

  // 1. Sheet: Ringkasan Eksekutif & Pengesahan
  createExecutiveSummarySheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period: periodStr,
    data,
    orderData,
    receiptData,
  });

  // 2. Sheet: Kebutuhan & Realisasi (BOM & PO Fulfillment)
  createFulfillmentSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period: periodStr,
    data,
  });

  // 3. Sheet: Rincian Kebutuhan (Bill of Materials / BOM)
  createRequirementSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period: periodStr,
    requirementData,
  });

  // 4. Sheet: Rincian Pesanan (Purchase Orders / PO)
  createOrderSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period: periodStr,
    orderData,
  });

  // 5. Sheet: Rincian Penerimaan (Goods Receipts / NP)
  createReceiptSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period: periodStr,
    receiptData,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
