import { projectRepo } from "@/db/repositories";

interface SeedProject {
  project_name: string;
  company_name: string;
  fiscal_year: number;
  stages: string[];
}

export async function seedProjects(): Promise<void> {
  const projects: SeedProject[] = [
    {
      project_name: "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi",
      company_name: "PT. Bangun Rumah Idaman",
      fiscal_year: 2026,
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
      project_name: "Renovasi Interior Kantor PT. xyz",
      company_name: "CV. Karya Mandiri",
      fiscal_year: 2026,
      stages: [
        "Pekerjaan Pembongkaran (Demolisi)",
        "Pekerjaan Partisi Kaca & Gypsum",
        "Pekerjaan ME (Mechanical Electrical)",
        "Pekerjaan Custom Furniture"
      ]
    },
    {
      project_name: "Pembangunan Gudang Logistik Cikarang",
      company_name: "PT. Konstruksi Maju Bersama",
      fiscal_year: 2026,
      stages: [
        "Pekerjaan Tanah & Cut and Fill",
        "Pekerjaan Struktur Baja (Warehouse)",
        "Pekerjaan Lantai Beton (Floor Hardener)",
        "Pekerjaan Utilitas Gudang"
      ]
    }
  ];

  for (const proj of projects) {
    const exists = await projectRepo.exists({ project_name: proj.project_name }, true);
    if (!exists) {
      const projectId = await projectRepo.create({
        project_name: proj.project_name,
        company_name: proj.company_name,
        fiscal_year: proj.fiscal_year
      });

      await projectRepo.saveStages(
        projectId, 
        proj.stages.map(s => ({ stage_name: s }))
      );
    }
  }
}
