import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useErrorStore } from '@/src/lib/errorTracking';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setFetchError } = useErrorStore();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message !== 'Auth session missing!') {
            console.error('Auth session error:', error);
          }
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_grant')) {
            await supabase.auth.signOut();
            setUser(null);
          }
          return;
        }
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth session catch error:', err);
        // If we get a fetch error, it might be a network issue or invalid URL
        if (err instanceof Error && err.message.includes('Failed to fetch')) {
          setFetchError(true);
          console.warn('Supabase fetch failed. Check your internet connection or Supabase URL.');
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
