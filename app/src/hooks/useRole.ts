import { useAuthStore } from '../store/authStore';

export function useRole() {
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return { isAdmin, isStaff, role: user?.role };
}
