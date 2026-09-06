import type { ItemLogEntry, RequirementReportItem } from "../report.service";

export interface ItemTransactionHistory {
  item: RequirementReportItem;
  logs: ItemLogEntry[];
}

export interface FulfillmentPdfContext {
  project_name: string;
  company_name: string;
  period: string;
  data: RequirementReportItem[];
  itemLogs?: ItemTransactionHistory[];
}

export interface TransactionHistoryPdfContext {
  project_name: string;
  company_name: string;
  period: string;
  itemLogs: ItemTransactionHistory[];
}

export interface PdfKopOptions {
  title: string;
  projectName: string;
  companyName: string;
  period: string;
  pageWidth: number;
  startY?: number;
}
