import { User } from "@/drizzle/schema";

type Permission =
  | 'project:create'
  | 'project:update'
  | 'project:read'
  | 'project:delete'
  | 'document:create'
  | 'document:update'
  | 'document:read'
  | 'document:delete';

const permissionByRole: Record<User['role'], Permission[]> = {
  admin: [
    'project:create',
    'project:update',
    'project:read',
    'project:delete',
    'document:create',
    'document:update',
    'document:read',
    'document:delete',
  ],
  author: [
    'project:read',
    'document:create',
    'document:update',
    'document:read',
  ],
  editor: [
    'project:read',
    'document:update',
    'document:read',
  ],
  viewer: [
    'project:read',
    'document:read',
  ],
};

export function can(user: Pick<User, 'role'> | null, permission: Permission) {
  if (user == null) {
    return false;
  }

  return permissionByRole[user.role].includes(permission);
}
