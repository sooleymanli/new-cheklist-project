import { useAppSelector } from './useStore';

export function usePermissions() {
  const permissions = useAppSelector((s) => s.auth.user?.role.permissions ?? []);

  const has = (perm?: string) => !perm || permissions.includes(perm);
  const hasAny = (perms: string[]) => perms.length === 0 || perms.some((p) => permissions.includes(p));

  return { permissions, has, hasAny };
}
