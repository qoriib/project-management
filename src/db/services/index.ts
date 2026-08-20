/**
 * Services Barrel Export.
 */

// ── Auth Service ─────────────────────────────────────────────────────────────
export { login, logout, checkIsAuthenticated, changePin } from "./auth.service";

// ── Report Service ───────────────────────────────────────────────────────────
export {
  getRequirementReport,
  getItemLog,
  getProjectOrderReport,
  getProjectReceiptReport,
  type RequirementReportItem,
  type ItemLogEntry,
  type OrderReportItem,
  type ReceiptReportItem,
} from "./report.service";

// ── Excel Export Service ─────────────────────────────────────────────────────
export {
  generateRequirementReportExcel,
  createExecutiveSummarySheet,
  createFulfillmentSheet,
  createOrderSheet,
  createReceiptSheet,
  type ExcelProjectMeta,
  type ExecutiveSummaryContext,
  type FulfillmentSheetContext,
  type OrderSheetContext,
  type ReceiptSheetContext,
} from "./excel.service";
