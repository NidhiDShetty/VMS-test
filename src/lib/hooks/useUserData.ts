import { useState, useEffect, useCallback } from 'react';
import { getUserData, UserData, isUserAuthenticated } from '@/app/api/user/routes';

interface UseUserDataReturn {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserData = (): UseUserDataReturn => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Check if user is authenticated before making the API call
    if (!isUserAuthenticated()) {
      console.warn('[useUserData] User not authenticated, skipping API call');
      setUserData(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getUserData();
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes('No auth data found') || err.message.includes('user may not be logged in')) {
          console.warn('[useUserData] User not logged in, setting userData to null');
          setUserData(null);
          setError(null); // Don't show error for not being logged in
        } else if (err.message.includes('Invalid auth data format')) {
          console.error('[useUserData] Invalid auth data format, clearing localStorage');
          localStorage.removeItem('authData');
          setUserData(null);
          setError('Session expired. Please log in again.');
        } else {
          setError(err.message);
          setUserData(null);
        }
      } else {
        setError('Failed to fetch user data');
        setUserData(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    userData,
    loading,
    error,
    refetch: fetchUserData,
  };
};
