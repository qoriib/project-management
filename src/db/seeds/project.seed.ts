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
    const exists = await projectRepo.exists({ project_name: proj.projectName }, true);

    if (!exists) {
      await projectRepo.create({
        company_name: proj.companyName,
        fiscal_year: proj.fiscalYear,
        project_name: proj.projectName,
      });
    }
  }
}
