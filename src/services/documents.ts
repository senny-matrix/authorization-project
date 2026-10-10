import {
  createDocument,
  deleteDocument,
  updateDocument,
} from "@/dal/documents/mutations";
import { getDocumentById, getDocumentWithUserInfo, getProjectDocuments } from "@/dal/documents/queries";
import { getProjectById } from "@/dal/projects/queries";

import { AuthorizationError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/session";

import { can } from "@/permissions/rbac";

import { documentSchema } from "@/schemas/documents";
import type { DocumentFormValues } from "@/schemas/documents";

export async function createDocumentService(
  projectId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser();
  if (user == null) return { message: "User not authenticated", status: 401 };

  // STEP 1 | Authorization - can they perform this action?
  // Only admins and authors may create documents.
  // PERMISSION:
  if (!can(user, 'document:create')) {
    throw new AuthorizationError(
      "User does not have permission to create a document",
    );
  }

  // STEP 2 | Validation - is the data valid?
  const result = documentSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid document data: ${result.error.message}`);
  }

  // STEP 3 | Create the document
  return await createDocument({
    ...result.data,
    projectId,
    creatorId: user.id,
    lastEditedById: user.id,
  });
}

export async function updateDocumentService(
  documentId: string,
  projectId: string,
  data: DocumentFormValues,
) {
  const user = await getCurrentUser();
  if (user == null) throw new Error("User not authenticated");

  // STEP 1 | Authorization - can they perform this action?
  // Viewers are read-only.
  // PERMISSION:
  if (!can(user, 'document:update')) {
    throw new AuthorizationError(
      "User does not have permission to update a document",
    );
  }

  // STEP 2 | Scope - documents belong to a project, and non-admins may only
  // touch documents in their own department. The edit page repeats this check
  // in the UI, but server functions are directly callable endpoints, so the
  // rule has to be enforced here too.
  const document = await getDocumentById(documentId);
  if (document == null) throw new Error("Document not found");

  const project = await getProjectById(document.projectId);
  if (project == null) throw new Error("Project not found");

  if (
    user.role !== "admin" &&
    project.department != null &&
    user.department !== project.department
  ) {
    throw new AuthorizationError(
      "User does not have permission to update this document",
    );
  }

  // STEP 3 | Validation - is the data valid?
  const result = documentSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid document data: ${result.error.message}`);
  }

  // STEP 4 | Update the document
  return await updateDocument(documentId, {
    ...result.data,
    lastEditedById: user.id,
  });
}

export async function deleteDocumentService(documentId: string) {
  const user = await getCurrentUser();
  if (user == null) return { message: "User not authenticated", status: 401 };

  // STEP 1 | Authorization - can they perform this action?
  // Deleting is destructive, so it is restricted to admins.
  // PERMISSION:
  if (!can(user, 'document:delete')) {
    throw new AuthorizationError(
      "User does not have permission to delete a document",
    );
  }

  // STEP 2 | Delete the document
  return await deleteDocument(documentId);
}

export async function getDocumentByIdService(id: string) {
  // PERMISSION:
  const user = await getCurrentUser();

  if (!can(user, "document:read")) {
    throw new AuthorizationError(
      "User does not have permission to read this document",
    );
  }

  return getDocumentById(id);
}

export async function getProjectDocumentsService(projectId: string) {
  // PERMISSION:
  const user = await getCurrentUser();

  if (!can(user, "document:read")) {
    throw new AuthorizationError(
      "User does not have permission to read this document",
    );
  }

  return getProjectDocuments(projectId);
}

export async function getDocumentWithUserInfoService(id: string) {
  // PERMISSION:
  const user = await getCurrentUser();

  if (!can(user, "document:read")) {
    throw new AuthorizationError(
      "User does not have permission to read this document",
    );
  }

  return getDocumentWithUserInfo(id);
}
