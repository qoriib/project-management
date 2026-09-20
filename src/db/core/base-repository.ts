/**
 * Base Repository — Generic CRUD with atomic transactions.
 *
 * Provides standard find/create/update/delete operations
 * that all entity repositories inherit and can extend.
 */

import { getDB } from "@/db/index";
import { QueryBuilder } from "./query-builder";
import { wrapDbError } from "./errors";
import { v7 as uuidv7 } from "uuid";
import type { FindOptions, ModelDefinition, OrderByClause, SimpleWhere } from "./types";

export abstract class BaseRepository<TEntity extends object, TCreate extends object, TUpdate extends object> {
  protected readonly model: ModelDefinition;

  constructor(model: ModelDefinition) {
    this.model = model;
  }

  /** Get the singleton database connection. */
  protected async db() {
    return getDB();
  }

  /**
   * Find all records, optionally filtered, sorted, and paginated.
   */
  async findAll(options?: FindOptions): Promise<TEntity[]> {
    const qb = this.query();

    if (options?.where) {
      qb.applySimpleWhere(options.where);
    }

    if (options?.orderBy) {
      const orders: OrderByClause[] = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
      for (const order of orders) {
        qb.orderBy(order.column, order.direction);
      }
    }

    if (options?.limit !== undefined) {
      qb.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      qb.offset(options.offset);
    }

    return qb.getMany<TEntity>();
  }

  /**
   * Find a single record by its primary key (UUID string).
   * Returns null if not found.
   */
  async findById(id: string): Promise<TEntity | null> {
    return this.query().where(this.model.primaryKey, "=", id).getOne<TEntity>();
  }

  /**
   * Find the first record matching the given where conditions.
   */
  async findOne(where: SimpleWhere): Promise<TEntity | null> {
    return this.query().applySimpleWhere(where).getOne<TEntity>();
  }

  /**
   * Count records matching optional where conditions.
   */
  async count(where?: SimpleWhere): Promise<number> {
    const qb = this.query();
    if (where) qb.applySimpleWhere(where);
    return qb.count();
  }

  /**
   * Check if a record exists matching the given conditions.
   */
  async exists(where: SimpleWhere): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  /**
   * Insert a new record with a generated UUID v7 as primary key.
   * Returns the UUID string of the newly created record.
   */
  async create(data: TCreate): Promise<string> {
    try {
      const id = this.generateId();
      const columns: string[] = [this.model.primaryKey];
      const placeholders: string[] = ["$1"];
      const params: unknown[] = [id];
      let paramIdx = 2;

      for (const col of this.model.createColumns) {
        let value = (data as Record<string, unknown>)[col];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        if (value !== undefined) {
          columns.push(col);
          placeholders.push(`$${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      const sql = `INSERT INTO ${this.model.tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      const db = await this.db();
      await db.execute(sql, params);
      return id;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Insert multiple records in batch with generated UUIDs.
   * Returns an array of generated primary keys.
   */
  async createMany(dataList: TCreate[]): Promise<string[]> {
    if (dataList.length === 0) return [];

    const columns: string[] = [this.model.primaryKey, ...this.model.createColumns];
    const ids: string[] = [];
    const rows: unknown[][] = [];

    for (const data of dataList) {
      const id = this.generateId();
      ids.push(id);
      const row: unknown[] = [id];
      for (const col of this.model.createColumns) {
        let val = (data as Record<string, unknown>)[col];
        if (typeof val === "boolean") {
          val = val ? 1 : 0;
        }
        row.push(val ?? null);
      }
      rows.push(row);
    }

    await this.bulkInsert(this.model.tableName, columns, rows);
    return ids;
  }

  /**
   * Update an existing record by its primary key (UUID string).
   * Only updates columns that are present in the data object and allowed by the model.
   */
  async update(id: string, data: Partial<TUpdate>): Promise<void> {
    try {
      const setClauses: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      for (const col of this.model.updateColumns) {
        let value = (data as Record<string, unknown>)[col];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        if (value !== undefined) {
          setClauses.push(`${col} = $${paramIdx++}`);
          params.push(value ?? null);
        }
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push("updated_at = datetime('now', 'localtime')");

      params.push(id);
      const sql = `UPDATE ${this.model.tableName} SET ${setClauses.join(", ")} WHERE ${this.model.primaryKey} = $${paramIdx}`;
      const db = await this.db();
      await db.execute(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Delete a record by its primary key.
   */
  async delete(id: string): Promise<void> {
    try {
      const db = await this.db();
      await db.execute(`DELETE FROM ${this.model.tableName} WHERE ${this.model.primaryKey} = $1`, [id]);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Delete records matching a where condition.
   */
  async deleteWhere(where: SimpleWhere): Promise<number> {
    try {
      const db = await this.db();
      const qb = new QueryBuilder().from(this.model.tableName).applySimpleWhere(where);
      const built = qb.build();

      const whereMatch = built.sql.match(/WHERE\s+([\s\S]+)$/);
      const whereClause = whereMatch ? `WHERE ${whereMatch[1]}` : "";
      const sql = `DELETE FROM ${this.model.tableName} ${whereClause}`;

      const res = await db.execute(sql, built.params);
      return res.rowsAffected ?? 0;
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Delete multiple records by an array of primary keys.
   */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.deleteWhere({ [this.model.primaryKey]: { in: ids } });
  }

  /**
   * Create a new QueryBuilder pre-configured for this model's table.
   */
  public query(alias?: string): QueryBuilder {
    return new QueryBuilder().from(this.model.tableName, alias);
  }

  /**
   * Execute a raw SELECT query and return typed results.
   */
  protected async rawSelect<T>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const db = await this.db();
      return await db.select<T[]>(sql, params);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Execute a raw SQL statement (UPDATE, DELETE, DDL, etc.).
   */
  protected async rawExecute(sql: string, params?: unknown[]): Promise<{ lastInsertId: number; rowsAffected: number }> {
    try {
      const db = await this.db();
      return await db.execute(sql, params as any[]);
    } catch (error) {
      throw wrapDbError(error, this.model.tableName);
    }
  }

  /**
   * Bulk insert multiple rows in a single query.
   * Reduces IPC calls from O(N) to O(1).
   */
  protected async bulkInsert(table: string, columns: string[], data: unknown[][]): Promise<void> {
    if (data.length === 0) return;

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

  /**
   * Generate a UUID v7 string.
   */
  public generateId(): string {
    return uuidv7();
  }
}
