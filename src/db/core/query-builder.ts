/**
 * Fluent SQL Query Builder.
 *
 * Generates parameterized SQL from method chains.
 * Supports SELECT, WHERE, JOIN, ORDER BY, GROUP BY, LIMIT/OFFSET,
 * and automatic soft-delete filtering.
 *
 * @example
 * ```ts
 * const { sql, params } = new QueryBuilder()
 *   .select("v.vendor_id", "v.vendor_name")
 *   .from("vendors", "v")
 *   .where("v.vendor_name", "LIKE", "%Sinar%")
 *   .orderBy("v.vendor_name", "ASC")
 *   .withSoftDelete("v")
 *   .build();
 * ```
 */

import type { JoinClause, JoinType, OrderDirection, WhereCondition, WhereOperator } from "./types";

interface BuiltQuery {
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
  private _orderBys: { column: string; direction: OrderDirection }[] = [];
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _softDeleteAlias: string | null = null;
  private _includeDeleted = false;

  // ── SELECT ───────────────────────────────────────────────────────────────

  /** Specify columns to select. Pass `"*"` or individual column names. */
  select(...columns: string[]): this {
    this._selectColumns.push(...columns);
    return this;
  }

  /** Specify a raw SELECT expression (e.g., aggregate or subquery). */
  selectRaw(expression: string): this {
    this._selectColumns.push(expression);
    return this;
  }

  // ── FROM ─────────────────────────────────────────────────────────────────

  /** Set the primary table. */
  from(table: string, alias?: string): this {
    this._from = table;
    this._fromAlias = alias ?? "";
    return this;
  }

  // ── JOIN ─────────────────────────────────────────────────────────────────

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

  // ── WHERE ────────────────────────────────────────────────────────────────

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

  /**
   * Add a raw WHERE expression. Useful for subqueries or complex conditions.
   * Use `$N` placeholders for parameters.
   */
  whereRaw(expression: string, params?: unknown[]): this {
    // Store as a special condition
    this._wheres.push({
      column: `__RAW__${expression}`,
      connector: "AND",
      operator: "=",
      value: params,
    });
    return this;
  }

  // ── GROUP BY & HAVING ──────────────────────────────────────────────────

  groupBy(...columns: string[]): this {
    this._groupBy.push(...columns);
    return this;
  }

  having(expression: string): this {
    this._having = expression;
    return this;
  }

  // ── ORDER BY ─────────────────────────────────────────────────────────────

  orderBy(column: string, direction: OrderDirection = "ASC"): this {
    this._orderBys.push({ column, direction });
    return this;
  }

  // ── LIMIT / OFFSET ───────────────────────────────────────────────────────

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  offset(n: number): this {
    this._offset = n;
    return this;
  }

  // ── SOFT DELETE ──────────────────────────────────────────────────────────

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

  // ── BUILD ────────────────────────────────────────────────────────────────

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
          // Replace $N placeholders with correct param indices
          let adjustedExpr = rawExpr;
          for (const rp of rawParams) {
            adjustedExpr = adjustedExpr.replace(/\$\d+/, `$${paramIdx}`);
            params.push(rp);
            paramIdx++;
          }
          fragment = adjustedExpr;
        } else if (cond.operator === "IS NULL" || cond.operator === "IS NOT NULL") {
          fragment = `${cond.column} ${cond.operator}`;
        } else if (cond.operator === "IN" && Array.isArray(cond.value)) {
          const placeholders = cond.value.map(() => `$${paramIdx++}`).join(", ");
          params.push(...cond.value);
          fragment = `${cond.column} IN (${placeholders})`;
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
}
