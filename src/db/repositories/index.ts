/**
 * Repository Barrel Export.
 *
 * All singleton repository instances and their associated types
 * are re-exported from here for convenient imports.
 *
 * @example
 * ```ts
 * import { projectRepo, type ProjectWithStages } from "@/db/repositories";
 * ```
 */

// ── Repository Instances ─────────────────────────────────────────────────────

export { projectRepo } from "./project.repository";
export { vendorRepo } from "./vendor.repository";
export { itemRepo } from "./item.repository";
export { itemCategoryRepo } from "./item-category.repository";
export { itemPriceRepo } from "./item-price.repository";
export { unitRepo } from "./unit.repository";
export { orderRepo } from "./order.repository";
export { requirementRepo } from "./requirement.repository";
export { receiptRepo } from "./receipt.repository";

// ── Extended Types ───────────────────────────────────────────────────────────

export type { ProjectWithRelations } from "./project.repository";
export type { ItemWithDetails } from "./item.repository";
export type { OrderWithSummary, OrderItemDetail, OrderFilters, OrderItemInput } from "./order.repository";
export type { RequirementDetail, RequirementFilters } from "./requirement.repository";
export type {
  ReceiptSummary,
  ReceiptItemDetail,
  ReceiptItemByOrder,
  ReceiptFilters,
  ReceiptItemInput,
} from "./receipt.repository";
export type { ItemPriceWithRelation } from "./item-price.repository";

// ── Model Types ──────────────────────────────────────────────────────────────

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

// ── Error Types ──────────────────────────────────────────────────────────────

export { DbError, NotFoundError, DuplicateError, ForeignKeyError, ValidationError } from "@/db/core/errors";

