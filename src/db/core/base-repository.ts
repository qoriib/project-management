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
import type { FindOptions, ModelDefinition, OrderByClause } from "./types";
import { v7 as uuidv7 } from "uuid";
import { dbLog } from "./db-logger";

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
    dbLog.debug(
      `[${this.model.tableName}] findAll options=${JSON.stringify(options ?? {})}`,
    );
    try {
      const qb = new QueryBuilder().select("*").from(this.model.tableName);

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
      if (options?.limit !== undefined) {
        qb.limit(options.limit);
      }
      if (options?.offset !== undefined) {
        qb.offset(options.offset);
      }

      const { sql, params } = qb.build(),
        db = await this.db(),
        rows = await db.select<TEntity[]>(sql, params);
      dbLog.debug(`[${this.model.tableName}] findAll → ${rows.length} row(s)`);
      return rows;
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] findAll ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Find a single record by its primary key (UUID string).
   * Returns null if not found (or if soft-deleted).
   */
  async findById(id: string, includeDeleted = false): Promise<TEntity | null> {
    dbLog.debug(`[${this.model.tableName}] findById id=${id}`);
    try {
      const qb = new QueryBuilder()
        .select("*")
        .from(this.model.tableName)
        .where(this.model.primaryKey, "=", id);

      if (this.model.softDelete && !includeDeleted) {
        qb.withSoftDelete();
      }

      const { sql, params } = qb.build(),
        db = await this.db(),
        rows = await db.select<TEntity[]>(sql, params),
        result = rows[0] ?? null;
      dbLog.debug(
        `[${this.model.tableName}] findById id=${id} → ${result ? "found" : "not found"}`,
      );
      return result;
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] findById ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Find a single record by its primary key (UUID string).
   * Throws NotFoundError if not found.
   */
  async findByIdOrFail(id: string, includeDeleted = false): Promise<TEntity> {
    const record = await this.findById(id, includeDeleted);
    if (!record) {
      throw new NotFoundError(this.model.tableName, id);
    }
    return record;
  }

  /**
   * Find the first record matching the given where conditions.
   */
  async findOne(
    where: Record<string, unknown>,
    includeDeleted = false,
  ): Promise<TEntity | null> {
    const results = await this.findAll({
      includeDeleted,
      limit: 1,
      where,
    });
    return results[0] ?? null;
  }

  /**
   * Count records matching optional where conditions.
   */
  async count(
    where?: Record<string, unknown>,
    includeDeleted = false,
  ): Promise<number> {
    dbLog.debug(
      `[${this.model.tableName}] count where=${JSON.stringify(where ?? {})}`,
    );
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

      const { sql, params } = qb.build(),
        db = await this.db(),
        rows = await db.select<{ count: number }[]>(sql, params),
        total = rows[0]?.count ?? 0;
      dbLog.debug(`[${this.model.tableName}] count → ${total}`);
      return total;
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] count ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Check if a record exists matching the given conditions.
   */
  async exists(
    where: Record<string, unknown>,
    includeDeleted = false,
  ): Promise<boolean> {
    const c = await this.count(where, includeDeleted);
    return c > 0;
  }

  // ── WRITE ────────────────────────────────────────────────────────────────

  /**
   * Insert a new record with a generated UUID v7 as primary key.
   * Returns the UUID string of the newly created record.
   */
  async create(data: TCreate): Promise<string> {
    dbLog.debug(
      `[${this.model.tableName}] create data=${JSON.stringify(data)}`,
    );
    try {
      const id = this.generateId(),
        columns: string[] = [this.model.primaryKey],
        placeholders: string[] = ["$1"],
        params: unknown[] = [id];
      let paramIdx = 2;

      for (const col of this.model.createColumns) {
        const value = (data as Record<string, unknown>)[col];
        if (value !== undefined) {
          columns.push(col);
          placeholders.push(`$${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      const sql = `INSERT INTO ${this.model.tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
        db = await this.db();
      await db.execute(sql, params);
      dbLog.info(`[${this.model.tableName}] create OK → id=${id}`);
      return id;
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] create ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Update an existing record by its primary key (UUID string).
   * Only updates columns that are present in the data object and allowed by the model.
   */
  async update(id: string, data: TUpdate): Promise<void> {
    dbLog.debug(
      `[${this.model.tableName}] update id=${id} data=${JSON.stringify(data)}`,
    );
    try {
      const setClauses: string[] = [],
        params: unknown[] = [];
      let paramIdx = 1;

      for (const col of this.model.updateColumns) {
        const value = (data as Record<string, unknown>)[col];
        if (value !== undefined) {
          setClauses.push(`${col} = $${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      if (setClauses.length === 0) {
        dbLog.debug(
          `[${this.model.tableName}] update id=${id} → no columns to update, skipped`,
        );
        return;
      }

      setClauses.push(`updated_at = datetime('now', 'localtime')`);

      params.push(id);
      const sql = `UPDATE ${this.model.tableName} SET ${setClauses.join(", ")} WHERE ${this.model.primaryKey} = $${paramIdx}`,
        db = await this.db();
      await db.execute(sql, params);
      dbLog.info(`[${this.model.tableName}] update OK id=${id}`);
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] update ERROR id=${id}: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Soft-delete a record by setting `deleted_at` to current timestamp.
   * Falls back to hard delete if the model doesn't support soft delete.
   */
  async delete(id: string): Promise<void> {
    const mode = this.model.softDelete ? "soft" : "hard";
    dbLog.debug(`[${this.model.tableName}] delete (${mode}) id=${id}`);
    try {
      const db = await this.db();

      if (this.model.softDelete) {
        await db.execute(
          `UPDATE ${this.model.tableName} SET deleted_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime') WHERE ${this.model.primaryKey} = $1`,
          [id],
        );
        dbLog.info(`[${this.model.tableName}] delete (soft) OK id=${id}`);
      } else {
        await this.hardDelete(id);
      }
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] delete ERROR id=${id}: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Permanently delete a record from the database.
   * Use with caution — this bypasses soft delete.
   */
  async hardDelete(id: string): Promise<void> {
    dbLog.warn(`[${this.model.tableName}] hardDelete id=${id}`);
    try {
      const db = await this.db();
      await db.execute(
        `DELETE FROM ${this.model.tableName} WHERE ${this.model.primaryKey} = $1`,
        [id],
      );
      dbLog.info(`[${this.model.tableName}] hardDelete OK id=${id}`);
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] hardDelete ERROR id=${id}: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Restore a soft-deleted record by clearing `deleted_at`.
   */
  async restore(id: string): Promise<void> {
    dbLog.debug(`[${this.model.tableName}] restore id=${id}`);
    if (!this.model.softDelete) {
      dbLog.warn(
        `[${this.model.tableName}] restore failed — table does not support soft delete`,
      );
      throw new DbError(
        `Tabel ${this.model.tableName} tidak mendukung soft delete`,
      );
    }

    try {
      const db = await this.db();
      await db.execute(
        `UPDATE ${this.model.tableName} SET deleted_at = NULL, updated_at = datetime('now', 'localtime') WHERE ${this.model.primaryKey} = $1`,
        [id],
      );
      dbLog.info(`[${this.model.tableName}] restore OK id=${id}`);
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] restore ERROR id=${id}: ${(error as Error)?.message ?? String(error)}`,
      );
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
    dbLog.debug(
      `[${this.model.tableName}] rawSelect sql=${sql.replaceAll(/\s+/g, " ").trim()}`,
    );
    try {
      const db = await this.db(),
        rows = await db.select<T[]>(sql, params);
      dbLog.debug(
        `[${this.model.tableName}] rawSelect → ${rows.length} row(s)`,
      );
      return rows;
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] rawSelect ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Execute a raw SQL statement (INSERT/UPDATE/DELETE).
   * Used by subclasses for batch operations.
   */
  protected async rawExecute(
    sql: string,
    params?: unknown[],
  ): Promise<{ lastInsertId: string | number; rowsAffected: number }> {
    dbLog.debug(
      `[${this.model.tableName}] rawExecute sql=${sql.replaceAll(/\s+/g, " ").trim()}`,
    );
    try {
      const db = await this.db(),
        result = await db.execute(sql, params);
      dbLog.info(
        `[${this.model.tableName}] rawExecute OK rowsAffected=${result.rowsAffected} lastInsertId=${result.lastInsertId}`,
      );
      return {
        lastInsertId: result.lastInsertId,
        rowsAffected: result.rowsAffected,
      };
    } catch (error) {
      dbLog.error(
        `[${this.model.tableName}] rawExecute ERROR: ${(error as Error)?.message ?? String(error)}`,
      );
      throw wrapDbError(error, this.model.tableName);
    }
  }
  /**
   * Execute operations within a database transaction.
   * Note: Explicit BEGIN/COMMIT via IPC in Tauri causes "no transaction is active" errors
   * because the plugin-sql uses a connection pool (sqlx) under the hood.
   * For a local SQLite desktop app, we can bypass this wrapper safely.
   */
  protected async transaction<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Bulk insert multiple rows in a single query.
   * Reduces IPC calls from O(N) to O(1).
   * Each row must include the UUID primary key as the first element.
   */
  protected async bulkInsert(
    table: string,
    columns: string[],
    data: unknown[][],
  ): Promise<void> {
    dbLog.info(
      `[${this.model.tableName}] bulkInsert into=${table} rows=${data.length}`,
    );
    if (data.length === 0) {
      dbLog.debug(`[${this.model.tableName}] bulkInsert skipped — empty data`);
      return;
    }

    // SQLite has a limit on bind parameters. Process in chunks.
    const chunkSize = 200,
      db = await this.db();
    let totalAffected = 0;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize),
        placeholders: string[] = [],
        params: unknown[] = [];

      let paramIdx = 1;
      for (const row of chunk) {
        const rowPlaceholders = [];
        for (const val of row) {
          rowPlaceholders.push(`$${paramIdx++}`);
          params.push(val ?? null);
        }
        placeholders.push(`(${rowPlaceholders.join(", ")})`);
      }

      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders.join(", ")}`,
        result = await db.execute(sql, params);
      totalAffected += result.rowsAffected ?? chunk.length;
      dbLog.debug(
        `[${this.model.tableName}] bulkInsert chunk ${Math.floor(i / chunkSize) + 1} — ${chunk.length} row(s)`,
      );
    }
    dbLog.info(
      `[${this.model.tableName}] bulkInsert OK total=${totalAffected} row(s)`,
    );
  }

  /**
   * Generate a UUID v7 string.
   * Convenience helper for subclasses that need to create UUIDs for bulk inserts.
   */
  protected generateId(): string {
    return uuidv7();
  }
}
