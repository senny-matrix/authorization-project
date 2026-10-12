import {
  createProject,
  deleteProject,
  updateProject,
} from "@/dal/projects/mutations";
import { getAllProjects, getProjectById } from "@/dal/projects/queries";
import { ProjectTable, User } from "@/drizzle/schema";
import { AuthorizationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";
import { canReadProject } from "@/permissions/projects";
import { can } from "@/permissions/rbac";
import { ProjectFormValues, projectSchema } from "@/schemas/projects";
import { eq, isNull, or } from "drizzle-orm";

export async function createProjectService(data: ProjectFormValues) {
  const user = await getCurrentUser();
  if (user == null)
    throw new Error("Unauthenticated user cannot create a project");

  // STEP 1 | Authorization - can they perform this action?
  // Only admins may create projects.
  // PERMISSION:
  if (!can(user, "project:create")) {
    throw new AuthorizationError(
      "User does not have permission to create a project",
    );
  }

  // STEP 2 | Validation - is the data valid?
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid project data: ${result.error.message}`);
  }

  // STEP 3 | Create the project
  return await createProject({
    ...result.data,
    ownerId: user.id,
    department: result.data.department || null,
  });
}

export async function updateProjectService(
  projectId: string,
  data: ProjectFormValues,
) {
  const user = await getCurrentUser();
  if (user == null)
    throw new Error("Unauthenticated user cannot update a project");

  // STEP 1 | Authorization - can they perform this action?
  // Only admins may update projects.
  // PERMISSION:
  if (!can(user, "project:update")) {
    throw new AuthorizationError(
      "User does not have permission to update a project",
    );
  }

  // STEP 2 | Validation - is the data valid?
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid project data: ${result.error.message}`);
  }

  // STEP 3 | Update the project
  return await updateProject(projectId, result.data);
}

export async function deleteProjectService(projectId: string) {
  const user = await getCurrentUser();
  if (user == null)
    throw new Error("Unauthenticated user cannot delete a project");

  // STEP 1 | Authorization - can they perform this action?
  // Deleting is destructive, so it is restricted to admins.
  // PERMISSION:
  if (!can(user, "project:delete")) {
    throw new AuthorizationError(
      "User does not have permission to delete a project",
    );
  }

  // STEP 2 | Delete the project
  return await deleteProject(projectId);
}

export async function getAllProjectsService({ ordered } = { ordered: false }) {
  // PERMISSION:
  const user = await getCurrentUser();
  if (user == null) throw new AuthorizationError("User not authenticated");

  return getAllProjects({ ordered }, userWhereClause(user));
}

export async function getProjectByIdService(id: string) {
  // PERMISSION:
  const user = await getCurrentUser();
  if (user == null) throw new AuthorizationError("User not authenticated");

  const project = await getProjectById(id);
  if (!project) return null;

  // PERMISSION:
  // Admins see every project. Everyone else may only see projects that are
  // either unassigned or belong to their own department.
  if (!canReadProject(user, project)) {
    return null;
  }

  return project;
}

// PERMISSION:
// Restricts a project listing to the rows the given user is allowed to see.
function userWhereClause(user: Pick<User, "role" | "department">) {
  const role = user.role;
  switch (role) {
    case "author":
    case "viewer":
    case "editor":
      return or(
        eq(ProjectTable.department, user.department),
        isNull(ProjectTable.department),
      );
    case "admin":
      return undefined;
    default: {
      const _exhaustiveCheck: never = role;
      throw new Error(`Unhandled user role: ${role}`);
    }
  }
}
