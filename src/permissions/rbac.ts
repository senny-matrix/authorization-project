import { User } from "@/drizzle/schema";

export type Permission =
  | 'project:create'
  | 'project:update'
  | 'project:read:all'
  | 'project:read:own-department'
  | 'project:read:global-department'
  | 'project:delete'
  | 'document:create'
  | 'document:update'
  | 'document:read'
  | 'document:delete';

const permissionByRole: Record<User['role'], Permission[]> = {
  admin: [
    'project:create',
    'project:update',
    'project:read:all',
    'project:delete',
    'document:create',
    'document:update',
    'document:read',
    'document:delete',
  ],
  author: [
    'project:read:global-department',
    'project:read:own-department',
    'document:create',
    'document:update',
    'document:read',
  ],
  editor: [
    'project:read:global-department',
    'project:read:own-department',
    'document:update',
    'document:read',
  ],
  viewer: [
    'project:read:global-department',
    'project:read:own-department',
    'document:read',
  ],
};

export function can(user: Pick<User, 'role'> | null, permission: Permission) {
  if (user == null) {
    return false;
  }

  return permissionByRole[user.role].includes(permission);
}
