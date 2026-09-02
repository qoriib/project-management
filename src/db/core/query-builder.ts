/**
 * Fluent SQL Query Builder.
 * Generates parameterized SQL from method chains.
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
  private _softDeleteAliases: string[] = [];
  private _includeDeleted = false;

  /** Specify columns to select. Pass `"*"` or individual column names. */
  select(...columns: string[]): this {
    this._selectColumns.push(...columns);
    return this;
  }

  /** Specify a raw SELECT expression. */
  selectRaw(expression: string): this {
    this._selectColumns.push(expression);
    return this;
  }

  /** Select a SUM aggregate with COALESCE. */
  selectSum(expression: string, alias: string, fallback = 0): this {
    return this.selectRaw(`COALESCE(SUM(${expression}), ${fallback}) as ${alias}`);
  }

  /** Select a COUNT aggregate. */
  selectCount(expression = "*", alias = "count"): this {
    return this.selectRaw(`COUNT(${expression}) as ${alias}`);
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

  /** Add a WHERE IN condition. */
  whereIn(column: string, values: unknown[]): this {
    if (values.length === 0) {
      return this.whereRaw("1 = 0");
    }
    return this.where(column, "IN", values);
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
   * Supports primitive values and filter objects (`gte`, `in`, `like`, etc.).
   */
  applyWhere(column: string, value: WhereValue): this {
    if (value === undefined) return this;
    if (value === null) return this.whereNull(column);
    if (Array.isArray(value)) return this.whereIn(column, value);

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

  /** Enable soft-delete filtering (adds `WHERE alias.deleted_at IS NULL`). Supports multiple table aliases. */
  withSoftDelete(...aliases: (string | undefined)[]): this {
    if (aliases.length === 0) {
      if (!this._softDeleteAliases.includes("")) {
        this._softDeleteAliases.push("");
      }
    } else {
      for (const a of aliases) {
        const alias = a ?? "";
        if (!this._softDeleteAliases.includes(alias)) {
          this._softDeleteAliases.push(alias);
        }
      }
    }
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
    cloned._softDeleteAliases = [...this._softDeleteAliases];
    cloned._includeDeleted = this._includeDeleted;
    return cloned;
  }

  /** Compile the query builder state into a parameterized SQL string + params. */
  build(): BuiltQuery {
    const parts: string[] = [];
    const params: unknown[] = [];
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
    if (this._softDeleteAliases.length > 0 && !this._includeDeleted) {
      for (let i = this._softDeleteAliases.length - 1; i >= 0; i--) {
        const alias = this._softDeleteAliases[i];
        const prefix = alias ? `${alias}.` : "";
        allWheres.unshift({
          column: `${prefix}deleted_at`,
          connector: "AND",
          operator: "IS NULL",
        });
      }
    }

    // WHERE
    if (allWheres.length > 0) {
      const whereParts: string[] = [];

      for (let i = 0; i < allWheres.length; i++) {
        const cond = allWheres[i];
        let fragment: string;

        if (cond.column.startsWith("__RAW__")) {
          const rawExpr = cond.column.slice(7);
          const rawParams = (cond.value as unknown[] | undefined) ?? [];
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
      parts.push(`LIMIT $${paramIdx++}`);
      params.push(this._limit);
    }

    if (this._offset !== null) {
      parts.push(`OFFSET $${paramIdx++}`);
      params.push(this._offset);
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
