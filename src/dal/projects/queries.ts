import { db } from "@/drizzle/db"
import { ProjectTable } from "@/drizzle/schema"
import { eq, or, isNull } from "drizzle-orm"
import { getCurrentUser } from "@/lib/session"

export async function getAllProjects({ ordered } = { ordered: false }) {
  // PERMISSION:
  const user = await getCurrentUser()
  if (user == null) return []

  if (user.role === "admin") {
    return db.query.ProjectTable.findMany({
      orderBy: ordered ? ProjectTable.name : undefined,
    })
  }

  return db.query.ProjectTable.findMany({
    where: or(
      eq(ProjectTable.department, user.department),
      isNull(ProjectTable.department),
    ),
    orderBy: ordered ? ProjectTable.name : undefined,
  })
}

export async function getProjectById(id: string) {
  return db.query.ProjectTable.findFirst({
    where: eq(ProjectTable.id, id),
  })
}
