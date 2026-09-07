pub const DB_NAME: &str = "proyek.db";
pub const DB_SQLITE_URL: &str = "sqlite:proyek.db";

// Auth constants
pub const DEFAULT_PIN: &str = "000000";
pub const PIN_LENGTH: usize = 6;
pub const AUTH_FILE_NAME: &str = "auth.bin";

// DB Sync constants
pub const SYNC_ARCHIVE_KEY: &str = "ProjectManagement_SecureSyncArchive_v1_Key!";
pub const SYNC_MANIFEST_NAME: &str = "manifest.json";

// Master tables: Synchronized globally, merged by updated_at on conflict
pub const MASTER_TABLES: &[(&str, &str, &str)] = &[
    (
        "vendors",
        "vendor_id",
        "vendor_name = excluded.vendor_name, phone = excluded.phone, address = excluded.address, deleted_at = excluded.deleted_at",
    ),
    (
        "item_categories",
        "category_id",
        "prefix = excluded.prefix, category_code = excluded.category_code, category_name = excluded.category_name, deleted_at = excluded.deleted_at",
    ),
    (
        "units",
        "unit_id",
        "unit_name = excluded.unit_name, deleted_at = excluded.deleted_at",
    ),
    (
        "items",
        "item_id",
        "item_code = excluded.item_code, item_name = excluded.item_name, category_id = excluded.category_id, unit_id = excluded.unit_id, deleted_at = excluded.deleted_at",
    ),
    (
        "item_prices",
        "item_price_id",
        "item_id = excluded.item_id, price = excluded.price, deleted_at = excluded.deleted_at",
    ),
];

// Project-scoped tables: Scoped to the selected project_id
pub const PROJECT_TABLES: &[&str] = &[
    "projects",
    "requirements",
    "orders",
    "order_items",
    "receipts",
    "receipt_items",
];
