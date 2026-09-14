export interface RequirementReportVariant {
  item_price_id: string;
  price: number;
  qty: number;
  has_tax: boolean;
  dpp: number;
  tax_amount: number;
  subtotal: number;
  vendor_name?: string | null;
}

export interface RequirementReportItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_id: string;
  item_code: string;
  category_id?: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category: string;
  unit: string;
  /** Primary / reference price */
  price?: number;
  planned_variants: RequirementReportVariant[];
  order_variants: RequirementReportVariant[];
  planned_volume: number;
  planned_dpp: number;
  planned_tax: number;
  planned_budget: number;
  total_ordered: number;
  total_order_dpp: number;
  total_order_tax: number;
  total_order_price: number;
  total_delivered: number;
  is_unplanned?: boolean;
  is_empty_group?: boolean;
  is_pagu_account?: boolean;
  group_budget?: number | null;
}

export interface ItemLogEntry {
  id: string;
  date: string;
  type: "Order" | "Receipt";
  reference: string;
  qty: number;
  vendor_name: string | null;
}

export interface OrderReportItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  order_code: string;
  order_date: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  has_tax: boolean;
  total_price: number;
}

export interface ReceiptReportItem {
  receipt_code: string;
  receipt_date: string;
  order_code: string;
  vendor_name: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
}

export interface RequirementReportDetailItem {
  requirement_group_id?: string | null;
  group_name?: string | null;
  item_code: string;
  category_prefix?: string;
  category_code?: string;
  item_name: string;
  category_name: string | null;
  unit_name: string | null;
  qty: number;
  price: number;
  has_tax: boolean;
  dpp: number;
  tax_amount: number;
  total_price: number;
}
