/**
 * Fluent SQL Query Builder.
 *
 * Generates parameterized SQL from method chains.
 * Supports SELECT, WHERE, JOIN, ORDER BY, GROUP BY, LIMIT/OFFSET,
 * subqueries, aggregate helpers, conditional clauses, and automatic soft-delete filtering.
 *
 * @example
 * ```ts
 * const { sql, params } = new QueryBuilder()
 *   .select("v.vendor_id", "v.vendor_name")
 *   .from("vendors", "v")
 *   .whereLike("v.vendor_name", "%Sinar%")
 *   .when(Boolean(status), (q) => q.where("v.status", "=", status))
 *   .orderBy("v.vendor_name", "ASC")
 *   .withSoftDelete("v")
 *   .build();
 * ```
 */

import { getDB } from "@/db/index";
import type {
  JoinClause,
  JoinType,
  OrderByClause,
  OrderDirection,
  SimpleWhere,
  WhereCondition,
  WhereFilterObject,
  WhereOperator,
  WhereValue,
} from "./types";

export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

export class QueryBuilder {
  private _selectColumns: string[] = [];
  private _from = "";
  private _fromAlias = "";
  private _joins: JoinClause[] = [];
  private _wheres: WhereCondition[] = [];
  private _groupBy: string[] = [];
  private _having: string | null = null;
  private _orderBys: OrderByClause[] = [];
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _softDeleteAlias: string | null = null;
  private _includeDeleted = false;

  /** Specify columns to select. Pass `"*"` or individual column names. */
  select(...columns: string[]): this {
    this._selectColumns.push(...columns);
    return this;
  }

  /** Specify a raw SELECT expression (e.g., aggregate, subquery, or complex calculation). */
  selectRaw(expression: string): this {
    this._selectColumns.push(expression);
    return this;
  }

  /** Select an EXISTS subquery as a boolean/int column. */
  selectExists(subquery: QueryBuilder | string, alias: string, params?: unknown[]): this {
    if (subquery instanceof QueryBuilder) {
      const built = subquery.build();
      return this.selectRaw(`EXISTS(${built.sql}) as ${alias}`);
    }
    if (params && params.length > 0) {
      this._selectColumns.push(`EXISTS(${subquery}) as ${alias}`);
    } else {
      this._selectColumns.push(`EXISTS(${subquery}) as ${alias}`);
    }
    return this;
  }

  /** Select a COALESCE expression. */
  selectCoalesce(columnOrExpr: string, fallback: unknown, alias?: string): this {
    const formattedFallback = typeof fallback === "string" ? `'${fallback}'` : String(fallback);
    const expr = `COALESCE(${columnOrExpr}, ${formattedFallback})`;
    return this.selectRaw(alias ? `${expr} as ${alias}` : expr);
  }

  /** Select a SUM aggregate with COALESCE. */
  selectSum(expression: string, alias: string, fallback = 0): this {
    return this.selectRaw(`COALESCE(SUM(${expression}), ${fallback}) as ${alias}`);
  }

  /** Select a COUNT aggregate. */
  selectCount(expression = "*", alias = "count"): this {
    return this.selectRaw(`COUNT(${expression}) as ${alias}`);
  }

  /** Select a MAX aggregate. */
  selectMax(expression: string, alias = "max_val"): this {
    return this.selectRaw(`MAX(${expression}) as ${alias}`);
  }

  /** Select a MIN aggregate. */
  selectMin(expression: string, alias = "min_val"): this {
    return this.selectRaw(`MIN(${expression}) as ${alias}`);
  }

  /** Select a GROUP_CONCAT aggregate. */
  selectGroupConcat(expression: string, alias: string, distinct = false, separator = ","): this {
    const distinctClause = distinct ? "DISTINCT " : "";
    const sepClause = separator !== "," ? `, '${separator}'` : "";
    return this.selectRaw(`GROUP_CONCAT(${distinctClause}${expression}${sepClause}) as ${alias}`);
  }

  /** Set the primary table. */
  from(table: string, alias?: string): this {
    this._from = table;
    this._fromAlias = alias ?? "";
    return this;
  }

  private addJoin(type: JoinType, table: string, aliasOrOn: string, on?: string): this {
    if (on) {
      this._joins.push({ alias: aliasOrOn, on, table, type });
    } else {
      this._joins.push({ on: aliasOrOn, table, type });
    }
    return this;
  }

  /** Add an INNER JOIN. */
  join(table: string, on: string): this;
  join(table: string, alias: string, on: string): this;
  join(table: string, aliasOrOn: string, on?: string): this {
    return this.addJoin("INNER", table, aliasOrOn, on);
  }

  /** Add a LEFT JOIN. */
  leftJoin(table: string, on: string): this;
  leftJoin(table: string, alias: string, on: string): this;
  leftJoin(table: string, aliasOrOn: string, on?: string): this {
    return this.addJoin("LEFT", table, aliasOrOn, on);
  }

  /** Add a WHERE condition (AND). */
  where(column: string, operator: WhereOperator, value?: unknown): this {
    this._wheres.push({ column, connector: "AND", operator, value });
    return this;
  }

  /** Add an additional AND WHERE condition. */
  andWhere(column: string, operator: WhereOperator, value?: unknown): this {
    return this.where(column, operator, value);
  }

  /** Add an OR WHERE condition. */
  orWhere(column: string, operator: WhereOperator, value?: unknown): this {
    this._wheres.push({ column, connector: "OR", operator, value });
    return this;
  }

  /** Add a WHERE IN condition. */
  whereIn(column: string, values: unknown[]): this {
    if (values.length === 0) {
      return this.whereRaw("1 = 0");
    }
    return this.where(column, "IN", values);
  }

  /** Add a WHERE NOT IN condition. */
  whereNotIn(column: string, values: unknown[]): this {
    if (values.length === 0) {
      return this.whereRaw("1 = 1");
    }
    return this.where(column, "NOT IN", values);
  }

  /** Add a WHERE IS NULL condition. */
  whereNull(column: string): this {
    return this.where(column, "IS NULL");
  }

  /** Add a WHERE IS NOT NULL condition. */
  whereNotNull(column: string): this {
    return this.where(column, "IS NOT NULL");
  }

  /** Add a WHERE LIKE condition. */
  whereLike(column: string, pattern: string): this {
    return this.where(column, "LIKE", pattern);
  }

  /** Add a WHERE BETWEEN condition. */
  whereBetween(column: string, min: unknown, max: unknown): this {
    return this.where(column, "BETWEEN", [min, max]);
  }

  /** Add a WHERE EXISTS condition with subquery or string. */
  whereExists(subquery: QueryBuilder | string, params?: unknown[]): this {
    if (subquery instanceof QueryBuilder) {
      const built = subquery.build();
      return this.whereRaw(`EXISTS(${built.sql})`, built.params);
    }
    return this.whereRaw(`EXISTS(${subquery})`, params);
  }

  /** Add a WHERE NOT EXISTS condition with subquery or string. */
  whereNotExists(subquery: QueryBuilder | string, params?: unknown[]): this {
    if (subquery instanceof QueryBuilder) {
      const built = subquery.build();
      return this.whereRaw(`NOT EXISTS(${built.sql})`, built.params);
    }
    return this.whereRaw(`NOT EXISTS(${subquery})`, params);
  }

  /**
   * Add a raw WHERE expression.
   * Use `$N` placeholders for parameters.
   */
  whereRaw(expression: string, params?: unknown[]): this {
    this._wheres.push({
      column: `__RAW__${expression}`,
      connector: "AND",
      operator: "=",
      value: params,
    });
    return this;
  }

  /**
   * Apply a flexible where condition for a column.
   * Supports primitive values (`=`, `IS NULL`) and filter objects (`gte`, `in`, `like`, etc.).
   */
  applyWhere(column: string, value: WhereValue): this {
    if (value === undefined) {
      return this;
    }

    if (value === null) {
      return this.whereNull(column);
    }

    if (Array.isArray(value)) {
      return this.whereIn(column, value);
    }

    if (typeof value === "object") {
      const filter = value as WhereFilterObject;
      if (filter.eq !== undefined) {
        if (filter.eq === null) this.whereNull(column);
        else this.where(column, "=", filter.eq);
      }
      if (filter.neq !== undefined) {
        if (filter.neq === null) this.whereNotNull(column);
        else this.where(column, "!=", filter.neq);
      }
      if (filter.gt !== undefined) this.where(column, ">", filter.gt);
      if (filter.gte !== undefined) this.where(column, ">=", filter.gte);
      if (filter.lt !== undefined) this.where(column, "<", filter.lt);
      if (filter.lte !== undefined) this.where(column, "<=", filter.lte);
      if (filter.like !== undefined) this.whereLike(column, filter.like);
      if (filter.notLike !== undefined) this.where(column, "NOT LIKE", filter.notLike);
      if (filter.in !== undefined && Array.isArray(filter.in)) this.whereIn(column, filter.in);
      if (filter.notIn !== undefined && Array.isArray(filter.notIn)) this.whereNotIn(column, filter.notIn);
      if (filter.between !== undefined && Array.isArray(filter.between)) {
        this.whereBetween(column, filter.between[0], filter.between[1]);
      }
      if (filter.isNull === true) this.whereNull(column);
      if (filter.isNotNull === true) this.whereNotNull(column);
      return this;
    }

    return this.where(column, "=", value);
  }

  /** Apply an entire SimpleWhere object dictionary. */
  applySimpleWhere(where?: SimpleWhere): this {
    if (!where) return this;
    for (const [column, value] of Object.entries(where)) {
      this.applyWhere(column, value);
    }
    return this;
  }

  /** Conditional query modification. */
  when(condition: unknown, callback: (qb: this) => void): this {
    if (condition) {
      callback(this);
    }
    return this;
  }

  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns);
    return this;
  }

  having(expression: string): this {
    this._having = expression;
    return this;
  }

  orderBy(column: string, direction: OrderDirection = "ASC"): this {
    this._orderBys.push({ column, direction });
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  /** Enable soft-delete filtering (adds `WHERE alias.deleted_at IS NULL`). */
  withSoftDelete(alias?: string): this {
    this._softDeleteAlias = alias ?? "";
    return this;
  }

  /** Bypass soft-delete filter to include deleted records. */
  includeDeleted(): this {
    this._includeDeleted = true;
    return this;
  }

  /** Create a deep clone of the current QueryBuilder instance. */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder();
    cloned._selectColumns = [...this._selectColumns];
    cloned._from = this._from;
    cloned._fromAlias = this._fromAlias;
    cloned._joins = [...this._joins];
    cloned._wheres = [...this._wheres];
    cloned._groupBy = [...this._groupBy];
    cloned._having = this._having;
    cloned._orderBys = [...this._orderBys];
    cloned._limit = this._limit;
    cloned._offset = this._offset;
    cloned._softDeleteAlias = this._softDeleteAlias;
    cloned._includeDeleted = this._includeDeleted;
    return cloned;
  }

  /** Compile the query builder state into a parameterized SQL string + params. */
  build(): BuiltQuery {
    const parts: string[] = [],
      params: unknown[] = [];
    let paramIdx = 1;

    // SELECT
    const columns = this._selectColumns.length > 0 ? this._selectColumns.join(", ") : "*";
    parts.push(`SELECT ${columns}`);

    // FROM
    if (!this._from) {
      throw new Error("QueryBuilder: FROM clause is required");
    }
    parts.push(`FROM ${this._from}${this._fromAlias ? ` ${this._fromAlias}` : ""}`);

    // JOINS
    for (const join of this._joins) {
      const tableExpr = join.alias ? `${join.table} ${join.alias}` : join.table;
      parts.push(`${join.type} JOIN ${tableExpr} ON ${join.on}`);
    }

    // Collect WHERE conditions
    const allWheres: WhereCondition[] = [...this._wheres];

    // Soft delete filter
    if (this._softDeleteAlias !== null && !this._includeDeleted) {
      const prefix = this._softDeleteAlias ? `${this._softDeleteAlias}.` : "";
      allWheres.unshift({
        column: `${prefix}deleted_at`,
        connector: "AND",
        operator: "IS NULL",
      });
    }

    // WHERE
    if (allWheres.length > 0) {
      const whereParts: string[] = [];

      for (let i = 0; i < allWheres.length; i++) {
        const cond = allWheres[i];
        let fragment: string;

        // Handle raw WHERE expressions
        if (cond.column.startsWith("__RAW__")) {
          const rawExpr = cond.column.slice(7),
            rawParams = (cond.value as unknown[] | undefined) ?? [];
          let adjustedExpr = rawExpr;
          for (const rp of rawParams) {
            adjustedExpr = adjustedExpr.replace(/\$\d+/, `$${paramIdx}`);
            params.push(rp);
            paramIdx++;
          }
          fragment = adjustedExpr;
        } else if (cond.operator === "IS NULL" || cond.operator === "IS NOT NULL") {
          fragment = `${cond.column} ${cond.operator}`;
        } else if ((cond.operator === "IN" || cond.operator === "NOT IN") && Array.isArray(cond.value)) {
          if (cond.value.length === 0) {
            fragment = cond.operator === "IN" ? "1 = 0" : "1 = 1";
          } else {
            const placeholders = cond.value.map(() => `$${paramIdx++}`).join(", ");
            params.push(...cond.value);
            fragment = `${cond.column} ${cond.operator} (${placeholders})`;
          }
        } else if (
          (cond.operator === "BETWEEN" || cond.operator === "NOT BETWEEN") &&
          Array.isArray(cond.value) &&
          cond.value.length === 2
        ) {
          const p1 = `$${paramIdx++}`;
          const p2 = `$${paramIdx++}`;
          params.push(cond.value[0], cond.value[1]);
          fragment = `${cond.column} ${cond.operator} ${p1} AND ${p2}`;
        } else {
          fragment = `${cond.column} ${cond.operator} $${paramIdx}`;
          params.push(cond.value);
          paramIdx++;
        }

        if (i === 0) {
          whereParts.push(fragment);
        } else {
          whereParts.push(`${cond.connector ?? "AND"} ${fragment}`);
        }
      }

      parts.push(`WHERE ${whereParts.join(" ")}`);
    }

    // GROUP BY
    if (this._groupBy.length > 0) {
      parts.push(`GROUP BY ${this._groupBy.join(", ")}`);
    }

    // HAVING
    if (this._having) {
      parts.push(`HAVING ${this._having}`);
    }

    // ORDER BY
    if (this._orderBys.length > 0) {
      const orderParts = this._orderBys.map((o) => `${o.column} ${o.direction}`);
      parts.push(`ORDER BY ${orderParts.join(", ")}`);
    }

    // LIMIT / OFFSET
    if (this._limit !== null) {
      parts.push(`LIMIT $${paramIdx}`);
      params.push(this._limit);
      paramIdx++;
    }

    if (this._offset !== null) {
      parts.push(`OFFSET $${paramIdx}`);
      params.push(this._offset);
      paramIdx++;
    }

    return { params, sql: parts.join("\n") };
  }

  /** Execute compiled query and fetch all matching rows. */
  async getMany<T>(): Promise<T[]> {
    const { sql, params } = this.build();
    const db = await getDB();
    return db.select<T[]>(sql, params);
  }

  /** Execute compiled query and fetch the first matching row. */
  async getOne<T>(): Promise<T | null> {
    this.limit(1);
    const rows = await this.getMany<T>();
    return rows[0] ?? null;
  }
}
