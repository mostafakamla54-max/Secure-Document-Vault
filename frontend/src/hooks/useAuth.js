import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export function useProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authService.getProfile();
        setUser(response.data);
      } catch (err) {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { user, loading };
}

export function usePermissions() {
  const { user } = useProfile();
  return {
    isAdmin: user?.is_superuser || user?.is_staff || false,
    isAuthenticated: !!user,
  };
}
