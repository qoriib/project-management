export const projectStatusValues = ["ON_PROGRESS", "COMPLETED", "SUSPENDED"] as const;
export const vendorTypeValues = ["MATERIAL_SUPPLIER", "EQUIPMENT_RENTAL", "STORE"] as const;
export const itemCategoryValues = ["MATERIAL", "ALAT", "BETON", "SOLAR", "ATK/K3"] as const;
export const invoiceStatusValues = ["UNPAID", "PARTIAL", "PAID"] as const;
export const ownershipTypeValues = ["INTERNAL", "EKSTERNAL"] as const;

export type ProjectStatus = typeof projectStatusValues[number];
export type VendorType = typeof vendorTypeValues[number];
export type ItemCategoryType = typeof itemCategoryValues[number];
export type InvoiceStatus = typeof invoiceStatusValues[number];
export type OwnershipType = typeof ownershipTypeValues[number];

export interface Project {
  project_id: number;
  project_name: string;
  company_name: string;
  fiscal_year: number;
  created_at: string;
}

export interface Vendor {
  vendor_id: number;
  vendor_name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Item {
  item_id: number;
  item_name: string;
  category: ItemCategoryType;
  unit: string;
}

export interface ItemPrice {
  price_id: number;
  item_id: number;
  price: number;
  created_at: string;
}

export interface ItemCategory {
  category_id: number;
  category_name: string;
}

export interface Unit {
  unit_id: number;
  unit_name: string;
}

export interface PurchaseOrder {
  po_id: number;
  project_id: number | null;
  po_date: string;
  created_at: string;
}

export interface POItem {
  po_item_id: number;
  po_id: number | null;
  item_id: number | null;
  item_price_id: number | null;
  vendor_id: number | null;
  qty: number;
}

export interface Delivery {
  delivery_id: number;
  po_id: number | null;
  delivery_date: string;
}

export interface DeliveryItem {
  delivery_item_id: number;
  delivery_id: number | null;
  po_item_id: number | null;
  qty: number;
}

export interface ProjectStage {
  stage_id: number;
  project_id: number;
  stage_name: string;
  created_at: string;
}

export interface BillOfMaterial {
  bom_id: number;
  project_id: number;
  stage_id: number;
  item_id: number;
  item_price_id: number;
  qty: number;
  created_at: string;
}
