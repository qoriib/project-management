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
export { purchaseOrderRepo } from "./purchase-order.repository";
export { bomGroupRepo } from "./bom-group.repository";
export { bomRepo } from "./bom.repository";
export { deliveryRepo } from "./delivery.repository";

// ── Extended Types ───────────────────────────────────────────────────────────

export type { BOMGroupWithProject } from "./bom-group.repository";

export type { ProjectWithRelations } from "./project.repository";
export type { ItemWithDetails } from "./item.repository";
export type { POWithSummary, POItemDetail, POFilters, POItemInput } from "./purchase-order.repository";
export type { BOMDetail, BOMFilters } from "./bom.repository";
export type {
  DeliverySummary,
  DeliveryItemDetail,
  DeliveryItemByPO,
  DeliveryFilters,
  DeliveryItemInput,
} from "./delivery.repository";
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
  PurchaseOrder,
  CreatePurchaseOrder,
  UpdatePurchaseOrder,
  BOMGroup,
  CreateBOMGroup,
  UpdateBOMGroup,
  POItem,
  CreatePOItem,
  BillOfMaterial,
  CreateBOM,
  UpdateBOM,
  Delivery,
  CreateDelivery,
  DeliveryItem,
  CreateDeliveryItem,
} from "@/db/models";

// ── Error Types ──────────────────────────────────────────────────────────────

export { DbError, NotFoundError, DuplicateError, ForeignKeyError, ValidationError } from "@/db/core/errors";
