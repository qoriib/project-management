import * as XLSX from "xlsx";

// ── Excel Export ──────────────────────────────────────────────────────────────

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Data"
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMultiSheet(
  sheets: { name: string; data: Record<string, unknown>[] }[],
  filename: string
): void {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── PDF Print ─────────────────────────────────────────────────────────────────

export function printToPDF(): void {
  window.print();
}

// ── DB Backup (Tauri) ─────────────────────────────────────────────────────────

export async function backupDatabase(): Promise<void> {
  try {
    // Use Tauri file dialog to let user pick save location
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { copyFile } = await import("@tauri-apps/plugin-fs");
    const { appDataDir } = await import("@tauri-apps/api/path");

    const dataDir = await appDataDir();
    const srcPath = `${dataDir}/proyek.db`;

    const savePath = await save({
      defaultPath: `backup-proyek-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
    });

    if (savePath) {
      await copyFile(srcPath, savePath);
    }
  } catch (err) {
    console.error("Backup failed:", err);
    throw err;
  }
}

export async function restoreDatabase(onRestore: () => void): Promise<void> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { copyFile } = await import("@tauri-apps/plugin-fs");
    const { appDataDir } = await import("@tauri-apps/api/path");

    const dataDir = await appDataDir();
    const destPath = `${dataDir}/proyek.db`;

    const filePath = await open({
      multiple: false,
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
    });

    if (filePath && typeof filePath === "string") {
      await copyFile(filePath, destPath);
      onRestore(); // trigger app reload or notification
    }
  } catch (err) {
    console.error("Restore failed:", err);
    throw err;
  }
}
