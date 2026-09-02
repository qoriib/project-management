/**
 * Core type definitions for the ORM layer.
 * Shared types used by QueryBuilder, BaseRepository, and domain repositories.
 */

export type WhereOperator =
  | "="
  | "!="
  | "<>"
  | ">"
  | "<"
  | ">="
  | "<="
  | "LIKE"
  | "NOT LIKE"
  | "IN"
  | "NOT IN"
  | "IS NULL"
  | "IS NOT NULL";

export type OrderDirection = "ASC" | "DESC";
export type JoinType = "INNER" | "LEFT" | "RIGHT" | "CROSS";

export interface WhereCondition {
  column: string;
  operator: WhereOperator;
  value?: unknown;
  connector?: "AND" | "OR";
}

/**
 * Filter object supporting operators for a column.
 * @example
 * { gte: "2026-01-01", lte: "2026-12-31" }
 * { in: ["id1", "id2"] }
 * { like: "%term%" }
 */
export interface WhereFilterObject {
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  like?: string;
  notLike?: string;
  in?: unknown[];
  notIn?: unknown[];
  isNull?: boolean;
  isNotNull?: boolean;
}

export type WhereValue = unknown | WhereFilterObject;

/**
 * Flexible where clause supporting primitive values and operator objects.
 * @example
 * { project_id: "123", order_date: { gte: "2026-01-01" }, status: { in: ["A", "B"] } }
 */
export type SimpleWhere = Record<string, WhereValue>;

export interface OrderByClause {
  column: string;
  direction: OrderDirection;
}

export interface FindOptions {
  where?: SimpleWhere;
  orderBy?: OrderByClause | OrderByClause[];
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface ModelDefinition {
  /** SQL table name */
  tableName: string;
  /** Primary key column name */
  primaryKey: string;
  /** Columns that can be set during INSERT (excludes PK and auto-generated) */
  createColumns: readonly string[];
  /** Columns that can be updated (usually same as createColumns) */
  updateColumns: readonly string[];
  /** Whether this table supports soft delete via `deleted_at` column */
  softDelete: boolean;
}

export interface JoinClause {
  type: JoinType;
  table: string;
  alias?: string;
  on: string;
}
