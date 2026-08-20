import type { RequirementReportItem, OrderReportItem, ReceiptReportItem } from "../report.service";

export interface ExcelProjectMeta {
  project_name: string;
  company_name: string;
  fiscal_year: string;
  period: string;
}

export interface ExecutiveSummaryContext extends ExcelProjectMeta {
  data: RequirementReportItem[];
  orderData: OrderReportItem[];
  receiptData: ReceiptReportItem[];
}

export interface FulfillmentSheetContext extends ExcelProjectMeta {
  data: RequirementReportItem[];
}

export interface OrderSheetContext extends ExcelProjectMeta {
  orderData: OrderReportItem[];
}

export interface ReceiptSheetContext extends ExcelProjectMeta {
  receiptData: ReceiptReportItem[];
}
