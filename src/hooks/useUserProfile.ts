import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuth } from './useAuth';
import { useErrorStore } from '@/src/lib/errorTracking';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ district: string | null; thana: string | null; id?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { setFetchError } = useErrorStore();

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('district, thana')
            .eq('id', user.id)
            .maybeSingle();
          if (error) throw error;
          if (data) setUserProfile(data);
        } catch (err: any) {
          console.error('Error fetching user profile for location priority:', err);
          if (err instanceof Error && err.message.includes('Failed to fetch')) {
            setFetchError(true);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  return { userProfile, loading };
};
