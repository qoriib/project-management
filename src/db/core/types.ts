/**
 * Core type definitions for the ORM layer.
 * Provides shared types used by QueryBuilder, BaseRepository, and all repositories.
 */

// ── SQL Operators ────────────────────────────────────────────────────────────

export type WhereOperator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL";

export type OrderDirection = "ASC" | "DESC";
export type JoinType = "INNER" | "LEFT" | "RIGHT";

// ── Where Clause ─────────────────────────────────────────────────────────────

export interface WhereCondition {
  column: string;
  operator: WhereOperator;
  value?: unknown;
  connector?: "AND" | "OR";
}

/**
 * Simple where clause shorthand: { column_name: value }
 * Maps to `column_name = value` conditions joined with AND.
 */
export type SimpleWhere = Record<string, unknown>;

// ── Find Options ─────────────────────────────────────────────────────────────

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

// ── Model Definition ─────────────────────────────────────────────────────────

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

// ── Query Result ─────────────────────────────────────────────────────────────

export interface ExecuteResult {
  lastInsertId: string | number;
  rowsAffected: number;
}

// ── Join Definition ──────────────────────────────────────────────────────────

export interface JoinClause {
  type: JoinType;
  table: string;
  alias?: string;
  on: string;
}
