import { getDB } from "@/db/index";
import type { BillOfMaterial as BaseBOM, ProjectStage as BaseProjectStage } from "@/db/schema";

export type ProjectStage = BaseProjectStage & {
  project_name?: string;
};

export type BillOfMaterial = BaseBOM & {
  item_name?: string;
  unit?: string;
  project_name?: string;
  stage_name?: string;
  category?: string;
  total_estimasi?: number;
  estimated_unit_price?: number;
};

// ── Project Stages ───────────────────────────────────────────────────────────

export async function getProjectStages(projectId: number): Promise<ProjectStage[]> {
  const db = await getDB();
  const query = `
    SELECT 
      ps.stage_id, ps.project_id, ps.stage_name, ps.created_at,
      p.project_name
    FROM project_stages ps
    LEFT JOIN projects p ON p.project_id = ps.project_id
    WHERE ps.project_id = $1
    ORDER BY ps.stage_id ASC
  `;
  return db.select<ProjectStage[]>(query, [projectId]);
}

export async function createProjectStage(data: Omit<ProjectStage, "stage_id" | "project_name" | "created_at">): Promise<void> {
  const db = await getDB();
  await db.execute(
    "INSERT INTO project_stages (project_id, stage_name) VALUES ($1, $2)",
    [data.project_id, data.stage_name]
  );
}

export async function updateProjectStage(id: number, data: Partial<Omit<ProjectStage, "stage_id" | "project_name" | "created_at">>): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;
  params.push(id);
  await db.execute(
    `UPDATE project_stages SET ${updates.join(", ")} WHERE stage_id = $${paramIdx}`,
    params
  );
}

export async function deleteProjectStage(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM project_stages WHERE stage_id = $1", [id]);
}

// ── Bill of Materials ────────────────────────────────────────────────────────

export async function getBOMs(filters?: {
  project_id?: number;
  stage_id?: number;
}): Promise<BillOfMaterial[]> {
  const db = await getDB();
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (filters?.project_id) {
    conditions.push(`b.project_id = $${paramIdx++}`);
    params.push(filters.project_id);
  }
  if (filters?.stage_id) {
    conditions.push(`b.stage_id = $${paramIdx++}`);
    params.push(filters.stage_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT 
      b.bom_id, b.project_id, b.stage_id, b.item_id, b.item_price_id, b.qty, 
      b.created_at,
      (b.qty * ip.price) as total_estimasi,
      ip.price as estimated_unit_price,
      i.item_name, i.unit, i.category, p.project_name, ps.stage_name
    FROM bill_of_materials b
    LEFT JOIN item_prices ip ON ip.price_id = b.item_price_id
    LEFT JOIN items i ON i.item_id = b.item_id
    LEFT JOIN projects p ON p.project_id = b.project_id
    LEFT JOIN project_stages ps ON ps.stage_id = b.stage_id
    ${whereClause}
    ORDER BY i.category ASC, i.item_name ASC
  `;

  return db.select<BillOfMaterial[]>(query, params);
}

export async function createBOM(
  data: Omit<BillOfMaterial, "bom_id" | "item_name" | "unit" | "project_name" | "stage_name" | "total_estimasi" | "estimated_unit_price" | "created_at">
): Promise<void> {
  const db = await getDB();
  await db.execute(
    `INSERT INTO bill_of_materials (project_id, stage_id, item_id, item_price_id, qty) 
     VALUES ($1, $2, $3, $4, $5)`,
    [data.project_id, data.stage_id, data.item_id, data.item_price_id, data.qty]
  );
}

export async function updateBOM(
  id: number,
  data: Partial<Omit<BillOfMaterial, "bom_id" | "item_name" | "unit" | "project_name" | "stage_name" | "total_estimasi" | "estimated_unit_price" | "created_at">>
): Promise<void> {
  const db = await getDB();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }
  }

  if (updates.length === 0) return;

  params.push(id);
  await db.execute(
    `UPDATE bill_of_materials SET ${updates.join(", ")} WHERE bom_id = $${paramIdx}`,
    params
  );
}

export async function deleteBOM(id: number): Promise<void> {
  const db = await getDB();
  await db.execute("DELETE FROM bill_of_materials WHERE bom_id = $1", [id]);
}
