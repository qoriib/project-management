import { projectRepo } from "@/db/repositories";

interface SeedProject {
  projectName: string;
  companyName: string;
  fiscalYear: number;
  stages: string[];
}

export async function seedProjects(): Promise<void> {
  const projects: SeedProject[] = [
    {
      projectName: "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi",
      companyName: "PT. Bangun Rumah Idaman",
      fiscalYear: 2026,
      stages: [
        "Pekerjaan Persiapan & Tanah",
        "Pekerjaan Pondasi & Beton Bertulang",
        "Pekerjaan Pasangan Dinding & Plesteran",
        "Pekerjaan Atap & Plafon",
        "Pekerjaan Lantai & Keramik",
        "Pekerjaan Elektrikal & Plumbing",
        "Pekerjaan Pengecatan & Finishing"
      ]
    },
    {
      projectName: "Renovasi Interior Kantor PT. xyz",
      companyName: "CV. Karya Mandiri",
      fiscalYear: 2026,
      stages: [
        "Pekerjaan Pembongkaran (Demolisi)",
        "Pekerjaan Partisi Kaca & Gypsum",
        "Pekerjaan ME (Mechanical Electrical)",
        "Pekerjaan Custom Furniture"
      ]
    },
    {
      projectName: "Pembangunan Gudang Logistik Cikarang",
      companyName: "PT. Konstruksi Maju Bersama",
      fiscalYear: 2026,
      stages: [
        "Pekerjaan Tanah & Cut and Fill",
        "Pekerjaan Struktur",
        "Pekerjaan Lantai Beton (Floor Hardener)",
        "Pekerjaan Utilitas Gudang"
      ]
    }
  ];

  for (const proj of projects) {
    const exists = await projectRepo.exists({ project_name: proj.projectName }, true);
    if (!exists) {
      const projectId = await projectRepo.create({
        project_name: proj.projectName,
        company_name: proj.companyName,
        fiscal_year: proj.fiscalYear
      });

      await projectRepo.saveStages(
        projectId, 
        proj.stages.map(s => ({ stage_name: s }))
      );
    }
  }
}
