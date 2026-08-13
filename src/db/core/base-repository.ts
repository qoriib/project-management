/**
 * Base Repository — Generic CRUD with soft-delete support.
 *
 * Provides standard find/create/update/delete operations
 * that all entity repositories inherit and can extend.
 *
 * @template TEntity   The full entity type returned from queries
 * @template TCreate   The shape of data for creating a new record
 * @template TUpdate   The shape of data for updating an existing record
 */

import { getDB } from "@/db/index";
import { QueryBuilder } from "./query-builder";
import { DbError, NotFoundError, wrapDbError } from "./errors";
import type { ModelDefinition, FindOptions, OrderByClause } from "./types";

export abstract class BaseRepository<
  TEntity extends object,
  TCreate extends object,
  TUpdate extends object,
> {
  protected readonly model: ModelDefinition;

  constructor(model: ModelDefinition) {
    this.model = model;
  }

  /** Get the singleton database connection. */
  protected async db() {
    return getDB();
  }

  // ── READ ─────────────────────────────────────────────────────────────────

  /**
   * Find all records, optionally filtered, sorted, and paginated.
   */
  async findAll(options?: FindOptions): Promise<TEntity[]> {
    try {
      const qb = new QueryBuilder()
        .select("*")
        .from(this.model.tableName);

      // Apply soft delete filter
      if (this.model.softDelete && !options?.includeDeleted) {
        qb.withSoftDelete();
      }

      // Apply simple where conditions
      if (options?.where) {
        for (const [column, value] of Object.entries(options.where)) {
          if (value === null) {
            qb.where(column, "IS NULL");
          } else {
            qb.where(column, "=", value);
          }
        }
      }

      // Apply order by
      if (options?.orderBy) {
        const orders: OrderByClause[] = Array.isArray(options.orderBy)
          ? options.orderBy
          : [options.orderBy];
        for (const order of orders) {
          qb.orderBy(order.column, order.direction);
        }
      }

      // Apply pagination
      if (options?.limit !== undefined) qb.limit(options.limit);
      if (options?.offset !== undefined) qb.offset(options.offset);

      const { sql, params } = qb.build();
      const db = await this.db();
      return db.select<TEntity[]>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Find a single record by its primary key.
   * Returns null if not found (or if soft-deleted).
   */
  async findById(id: number, includeDeleted = false): Promise<TEntity | null> {
    try {
      const qb = new QueryBuilder()
        .select("*")
        .from(this.model.tableName)
        .where(this.model.primaryKey, "=", id);

      if (this.model.softDelete && !includeDeleted) {
        qb.withSoftDelete();
      }

      const { sql, params } = qb.build();
      const db = await this.db();
      const rows = await db.select<TEntity[]>(sql, params);
      return rows[0] ?? null;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Find a single record by its primary key.
   * Throws NotFoundError if not found.
   */
  async findByIdOrFail(id: number, includeDeleted = false): Promise<TEntity> {
    const record = await this.findById(id, includeDeleted);
    if (!record) {
      throw new NotFoundError(this.model.tableName, id);
    }
    return record;
  }

  /**
   * Find the first record matching the given where conditions.
   */
  async findOne(where: Record<string, unknown>, includeDeleted = false): Promise<TEntity | null> {
    const results = await this.findAll({
      where,
      limit: 1,
      includeDeleted,
    });
    return results[0] ?? null;
  }

  /**
   * Count records matching optional where conditions.
   */
  async count(where?: Record<string, unknown>, includeDeleted = false): Promise<number> {
    try {
      const qb = new QueryBuilder()
        .selectRaw("COUNT(*) as count")
        .from(this.model.tableName);

      if (this.model.softDelete && !includeDeleted) {
        qb.withSoftDelete();
      }

      if (where) {
        for (const [column, value] of Object.entries(where)) {
          if (value === null) {
            qb.where(column, "IS NULL");
          } else {
            qb.where(column, "=", value);
          }
        }
      }

      const { sql, params } = qb.build();
      const db = await this.db();
      const rows = await db.select<{ count: number }[]>(sql, params);
      return rows[0]?.count ?? 0;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Check if a record exists matching the given conditions.
   */
  async exists(where: Record<string, unknown>, includeDeleted = false): Promise<boolean> {
    const c = await this.count(where, includeDeleted);
    return c > 0;
  }

  // ── WRITE ────────────────────────────────────────────────────────────────

  /**
   * Insert a new record and return the auto-generated ID.
   */
  async create(data: TCreate): Promise<number> {
    try {
      const columns: string[] = [];
      const placeholders: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const col of this.model.createColumns) {
        const value = (data as Record<string, unknown>)[col];
        if (value !== undefined) {
          columns.push(col);
          placeholders.push(`$${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      if (columns.length === 0) {
        throw new DbError("Tidak ada data yang diberikan untuk insert");
      }

      const sql = `INSERT INTO ${this.model.tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      const db = await this.db();
      const result = await db.execute(sql, params);
      return result.lastInsertId as number;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Update an existing record by its primary key.
   * Only updates columns that are present in the data object and allowed by the model.
   */
  async update(id: number, data: TUpdate): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const col of this.model.updateColumns) {
        const value = (data as Record<string, unknown>)[col];
        if (value !== undefined) {
          setClauses.push(`${col} = $${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      if (setClauses.length === 0) return; // Nothing to update

      params.push(id);
      const sql = `UPDATE ${this.model.tableName} SET ${setClauses.join(", ")} WHERE ${this.model.primaryKey} = $${paramIdx}`;
      const db = await this.db();
      await db.execute(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Soft-delete a record by setting `deleted_at` to current timestamp.
   * Falls back to hard delete if the model doesn't support soft delete.
   */
  async delete(id: number): Promise<void> {
    try {
      const db = await this.db();

      if (this.model.softDelete) {
        await db.execute(
          `UPDATE ${this.model.tableName} SET deleted_at = datetime('now', 'localtime') WHERE ${this.model.primaryKey} = $1`,
          [id]
        );
      } else {
        await this.hardDelete(id);
      }
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Permanently delete a record from the database.
   * Use with caution — this bypasses soft delete.
   */
  async hardDelete(id: number): Promise<void> {
    try {
      const db = await this.db();
      await db.execute(
        `DELETE FROM ${this.model.tableName} WHERE ${this.model.primaryKey} = $1`,
        [id]
      );
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Restore a soft-deleted record by clearing `deleted_at`.
   */
  async restore(id: number): Promise<void> {
    if (!this.model.softDelete) {
      throw new DbError(`Tabel ${this.model.tableName} tidak mendukung soft delete`);
    }

    try {
      const db = await this.db();
      await db.execute(
        `UPDATE ${this.model.tableName} SET deleted_at = NULL WHERE ${this.model.primaryKey} = $1`,
        [id]
      );
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  // ── QUERY BUILDER ACCESS ─────────────────────────────────────────────────

  /**
   * Create a new QueryBuilder pre-configured for this model's table.
   * Used by subclasses for custom/complex queries.
   */
  protected query(alias?: string): QueryBuilder {
    const qb = new QueryBuilder().from(this.model.tableName, alias);
    if (this.model.softDelete) {
      qb.withSoftDelete(alias);
    }
    return qb;
  }

  /**
   * Execute a raw SELECT query and return typed results.
   * Used by subclasses for complex joins and aggregations.
   */
  protected async rawSelect<T>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const db = await this.db();
      return db.select<T[]>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Execute a raw SQL statement (INSERT/UPDATE/DELETE).
   * Used by subclasses for batch operations.
   */
  protected async rawExecute(sql: string, params?: unknown[]): Promise<{ lastInsertId: number; rowsAffected: number }> {
    try {
      const db = await this.db();
      const result = await db.execute(sql, params);
      return {
        lastInsertId: result.lastInsertId as number,
        rowsAffected: result.rowsAffected,
      };
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }
  /**
   * Execute operations within a database transaction.
   * This drastically improves performance for bulk inserts/updates.
   */
  protected async transaction<T>(operation: () => Promise<T>): Promise<T> {
    const db = await this.db();
    await db.execute("BEGIN TRANSACTION");
    try {
      const result = await operation();
      await db.execute("COMMIT");
      return result;
    } catch (error) {
      await db.execute("ROLLBACK");
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Bulk insert multiple rows in a single query.
   * Reduces IPC calls from O(N) to O(1).
   */
  protected async bulkInsert(table: string, columns: string[], data: unknown[][]): Promise<void> {
    if (data.length === 0) return;
    
    // SQLite has a limit on bind parameters. Process in chunks.
    const chunkSize = 200; 
    const db = await this.db();
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const placeholders: string[] = [];
      const params: unknown[] = [];
      
      let paramIdx = 1;
      for (const row of chunk) {
        const rowPlaceholders = [];
        for (const val of row) {
          rowPlaceholders.push(`$${paramIdx++}`);
          params.push(val ?? null);
        }
        placeholders.push(`(${rowPlaceholders.join(", ")})`);
      }
      
      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders.join(", ")}`;
      await db.execute(sql, params);
    }
  }
}
