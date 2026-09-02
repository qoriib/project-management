/**
 * Repository Barrel Export.
 *
 * All singleton repository instances and their associated types
 * are re-exported from here for convenient imports.
 *
 * @example
 * ```ts
 * import { projectRepo, orderRepo, orderItemRepo, type ProjectWithRelations } from "@/db/repositories";
 * ```
 */

export { projectRepo } from "./project.repository";
export { vendorRepo } from "./vendor.repository";
export { itemRepo } from "./item.repository";
export { itemCategoryRepo } from "./item-category.repository";
export { itemPriceRepo } from "./item-price.repository";
export { unitRepo } from "./unit.repository";
export { orderRepo } from "./order.repository";
export { orderItemRepo } from "./order-item.repository";
export { requirementRepo } from "./requirement.repository";
export { receiptRepo } from "./receipt.repository";
export { receiptItemRepo } from "./receipt-item.repository";

export type { ProjectWithRelations } from "./project.repository";
export type { VendorWithRelation } from "./vendor.repository";
export type { UnitWithRelation } from "./unit.repository";
export type { ItemCategoryWithRelation } from "./item-category.repository";
export type { ItemWithDetails } from "./item.repository";
export type { OrderWithSummary, OrderFilters } from "./order.repository";
export type { OrderItemDetail, OrderItemInput } from "./order-item.repository";
export type { RequirementDetail, RequirementFilters } from "./requirement.repository";
export type { ReceiptSummary, ReceiptFilters } from "./receipt.repository";
export type { ReceiptItemDetail, ReceiptItemByOrder, ReceiptItemInput } from "./receipt-item.repository";
export type { ItemPriceWithRelation } from "./item-price.repository";

export type {
  Project,
  CreateProject,
  UpdateProject,
  Vendor,
  CreateVendor,
  UpdateVendor,
  Item,
  CreateItem,
  UpdateItem,
  ItemPrice,
  CreateItemPrice,
  UpdateItemPrice,
  ItemCategory,
  CreateItemCategory,
  UpdateItemCategory,
  Unit,
  CreateUnit,
  UpdateUnit,
  Order,
  CreateOrder,
  UpdateOrder,
  OrderItem,
  CreateOrderItem,
  Requirement,
  CreateRequirement,
  UpdateRequirement,
  Receipt,
  CreateReceipt,
  ReceiptItem,
  CreateReceiptItem,
} from "@/db/models";

export { DbError, NotFoundError, DuplicateError, ForeignKeyError, ValidationError } from "@/db/core/errors";
