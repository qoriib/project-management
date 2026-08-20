import { bomGroupRepo, projectRepo } from "../repositories";

export async function seedBOMGroups() {
  console.log("Seeding BOM Groups...");

  const projects = await projectRepo.findAll(),
    groups = ["Base A", "Base B", "Umum"];

  let totalSeeded = 0;

  for (const project of projects) {
    for (const group of groups) {
      await bomGroupRepo.create({
        group_name: group,
        project_id: project.project_id,
      });
      totalSeeded++;
    }
  }

  console.log(
    `Seeded ${totalSeeded} BOM Groups across ${projects.length} projects`,
  );
}
