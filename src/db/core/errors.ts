/**
 * Custom error classes for the database layer.
 * Provides semantic error types that consumers can catch and handle gracefully.
 */

export class DbError extends Error {
  public readonly code: string;

  constructor(message: string, code = "DB_ERROR") {
    super(message);
    this.name = "DbError";
    this.code = code;
  }
}

/** Thrown when a record is not found by ID or unique constraint. */
export class NotFoundError extends DbError {
  public readonly table: string;
  public readonly id: number | string;

  constructor(table: string, id: number | string) {
    super(`Record tidak ditemukan: ${table} dengan ID ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
    this.table = table;
    this.id = id;
  }
}

/** Thrown when a UNIQUE constraint is violated (duplicate entry). */
export class DuplicateError extends DbError {
  public readonly table: string;
  public readonly column: string;

  constructor(table: string, column: string) {
    super(`Data duplikat: ${column} sudah ada di tabel ${table}`, "DUPLICATE");
    this.name = "DuplicateError";
    this.table = table;
    this.column = column;
  }
}

/** Thrown when a FOREIGN KEY constraint is violated. */
export class ForeignKeyError extends DbError {
  public readonly table: string;

  constructor(table: string, detail?: string) {
    super(
      `Tidak dapat menghapus ${table}: masih digunakan oleh data lain${detail ? ` (${detail})` : ""}`,
      "FOREIGN_KEY",
    );
    this.name = "ForeignKeyError";
    this.table = table;
  }
}

/** Thrown when input data fails validation before reaching the database. */
export class ValidationError extends DbError {
  public readonly field: string;

  constructor(field: string, message: string) {
    super(`Validasi gagal untuk ${field}: ${message}`, "VALIDATION");
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Wraps a raw database error into a semantic DbError subtype.
 * Parses SQLite error messages to detect constraint violations.
 *
 * @param error The raw error from `@tauri-apps/plugin-sql`
 * @param table The table name for context
 * @returns A typed DbError (or the original error if not recognizable)
 */
export function wrapDbError(error: unknown, table: string): DbError {
  if (error instanceof DbError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  // SQLite UNIQUE constraint violation
  if (message.includes("UNIQUE constraint failed")) {
    const match = message.match(/UNIQUE constraint failed:\s*(\S+)/),
      column = match?.[1]?.split(".").pop() ?? "unknown";
    return new DuplicateError(table, column);
  }

  // SQLite FOREIGN KEY constraint violation
  if (message.includes("FOREIGN KEY constraint failed")) {
    return new ForeignKeyError(table);
  }

  // NOT NULL constraint
  if (message.includes("NOT NULL constraint failed")) {
    const match = message.match(/NOT NULL constraint failed:\s*(\S+)/),
      column = match?.[1]?.split(".").pop() ?? "unknown";
    return new ValidationError(column, "nilai tidak boleh kosong");
  }

  // Custom TRIGGER validations (RAISE ABORT)
  if (message.includes("Gagal:")) {
    // Extract the message after 'Gagal:' or just return the whole message gracefully
    const customMessage = message.split("Gagal:")[1]?.trim() || message;
    return new DbError(`Gagal: ${customMessage}`, "TRIGGER_VALIDATION");
  }

  // Fallback: wrap in generic DbError
  return new DbError(`Database error pada tabel ${table}: ${message}`);
}
