import { projectRepo } from "@/db/repositories";

interface SeedProject {
  projectName: string;
  companyName: string;
  fiscalYear: number;
}

export async function seedProjects(): Promise<void> {
  const projects: SeedProject[] = [
    {
      companyName: "PT. Bangun Rumah Idaman",
      fiscalYear: 2026,
      projectName: "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi",
    },
    {
      companyName: "CV. Karya Mandiri",
      fiscalYear: 2026,
      projectName: "Renovasi Interior Kantor PT. xyz",
    },
    {
      companyName: "PT. Konstruksi Maju Bersama",
      fiscalYear: 2026,
      projectName: "Pembangunan Gudang Logistik Cikarang",
    },
  ];

  for (const proj of projects) {
    const exists = await projectRepo.exists({ project_name: proj.projectName });

    if (!exists) {
      await projectRepo.create({
        company_name: proj.companyName,
        fiscal_year: proj.fiscalYear,
        project_name: proj.projectName,
      });
    }
  }
}

/**
 * Mengunci / menyetujui proyek tertentu setelah kebutuhan selesai disemai.
 * Proyek 1 dan 2 disetujui (locked / ACC), sedangkan Proyek 3 dibiarkan berstatus Draft
 * (unlocked) agar pengguna dapat bereksperimen dengan aksi penguncian / approval di UI.
 */
export async function approveSeededProjects(): Promise<void> {
  const approvedProjectNames = ["Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi", "Renovasi Interior Kantor PT. xyz"];

  for (const name of approvedProjectNames) {
    const proj = await projectRepo.findOne({ project_name: name });
    if (proj && proj.requirements_is_approved !== 1) {
      await projectRepo.update(proj.project_id, {
        requirements_is_approved: 1,
      });
    }
  }
}
