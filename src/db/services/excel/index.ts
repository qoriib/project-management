import * as ExcelJS from "exceljs";
import {
  getRequirementReport,
  getProjectRequirementReport,
  getProjectOrderReport,
  getProjectReceiptReport,
} from "../report";
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
export { createPurchaseOrderSheet, generatePurchaseOrderExcel } from "./purchase-order-sheet";
export type { PurchaseOrderExcelContext } from "./purchase-order-sheet";
export { createAssetRequestSheet, generateAssetRequestExcel } from "./asset-request-sheet";
export type { AssetRequestExcelContext } from "./asset-request-sheet";

export * from "./types";
export * from "./styles";
export * from "./utils";

/**
 * Menghasilkan dokumen Excel formal khusus Laporan Pemenuhan (Fulfillment).
 */
export async function generateReportExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [projectRecord, fulfillmentData] = await Promise.all([
    projectRepo.findById(projectId),
    getRequirementReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();
  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";
  const formattedPeriod = formatPeriod(startDate, endDate);

  createFulfillmentSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    data: fulfillmentData,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Menghasilkan dokumen Excel formal khusus Rencana Kebutuhan (BOQ).
 */
export async function generateRequirementExcel(projectId: string): Promise<Uint8Array> {
  const [projectRecord, requirementData] = await Promise.all([
    projectRepo.findById(projectId),
    getProjectRequirementReport(projectId),
  ]);

  const workbook = new ExcelJS.Workbook();
  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";

  createRequirementSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: "Semua Periode",
    requirementData,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Menghasilkan dokumen Excel formal khusus Pesanan Pembelian (PO).
 */
export async function generateOrderExcel(projectId: string, startDate?: string, endDate?: string): Promise<Uint8Array> {
  const [projectRecord, orderData] = await Promise.all([
    projectRepo.findById(projectId),
    getProjectOrderReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();
  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";
  const formattedPeriod = formatPeriod(startDate, endDate);

  createOrderSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    orderData,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Menghasilkan dokumen Excel formal khusus Penerimaan Barang (NP).
 */
export async function generateReceiptExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [projectRecord, receiptData] = await Promise.all([
    projectRepo.findById(projectId),
    getProjectReceiptReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();
  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";
  const formattedPeriod = formatPeriod(startDate, endDate);

  createReceiptSheet(workbook, {
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    receiptData,
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(arrayBuffer);
}
