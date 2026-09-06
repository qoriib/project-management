import type { ItemLogEntry, RequirementReportItem } from "../report.service";

export interface ItemTransactionHistory {
  item: FulfillmentPdfItem;
  logs: ItemLogEntry[];
}

export interface FulfillmentPdfItem extends RequirementReportItem {
  period_ordered?: number;
  cumulative_ordered?: number;
  period_delivered?: number;
  cumulative_delivered?: number;
}

export interface FulfillmentPdfContext {
  project_name: string;
  company_name: string;
  period: string;
  data: FulfillmentPdfItem[];
  itemLogs?: ItemTransactionHistory[];
  hasDateRange?: boolean;
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
