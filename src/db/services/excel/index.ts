import * as ExcelJS from "exceljs";
import {
  getRequirementReport,
  getProjectRequirementReport,
  getProjectOrderReport,
  getProjectReceiptReport,
} from "../report.service";
import { projectRepo } from "@/db/repositories";
import { createFulfillmentSheet } from "./fulfillment-sheet";
import { createRequirementSheet } from "./requirement-sheet";
import { createOrderSheet } from "./order-sheet";
import { createReceiptSheet } from "./receipt-sheet";
import { formatPeriod } from "@/utils/formatters";

export { createFulfillmentSheet } from "./fulfillment-sheet";
export { createRequirementSheet } from "./requirement-sheet";
export { createOrderSheet } from "./order-sheet";
export { createReceiptSheet } from "./receipt-sheet";

export * from "./types";
export * from "./styles";
export * from "./utils";

/**
 * Generates a formal institutional standard multi-sheet Excel report.
 */
export async function generateReportExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [projectRecord, fulfillmentData, requirementData, orderData, receiptData] = await Promise.all([
    projectRepo.findById(projectId),
    getRequirementReport(projectId, startDate, endDate),
    getProjectRequirementReport(projectId),
    getProjectOrderReport(projectId, startDate, endDate),
    getProjectReceiptReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();

  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";

  const formattedPeriod = formatPeriod(startDate, endDate);

  // 1. Sheet: Laporan Pemenuhan
  createFulfillmentSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    data: fulfillmentData,
  });

  // 2. Sheet: Laporan Kebutuhan (BOQ)
  createRequirementSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    requirementData,
  });

  // 3. Sheet: Laporan Pesanan (PO)
  createOrderSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    orderData,
  });

  // 4. Sheet: Laporan Penerimaan (NP)
  createReceiptSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    receiptData,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();

  return new Uint8Array(arrayBuffer);
}
