import { db } from "@/drizzle/db"
import { ProjectTable} from "@/drizzle/schema"
import { eq, SQL } from "drizzle-orm"

export async function getAllProjects({ ordered } = { ordered: false }, whereClause: SQL | undefined = undefined) {
  // PERMISSION:
  return db.query.ProjectTable.findMany({
    orderBy: ordered ? ProjectTable.name : undefined,
    where: whereClause,
  })
}

export async function getProjectById(id: string) {
  return db.query.ProjectTable.findFirst({
    where: eq(ProjectTable.id, id),
  })
}
