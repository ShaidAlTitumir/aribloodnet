import { supabase, isSupabaseConfigured } from './supabase';
import { useErrorStore } from './errorTracking';

export interface AppStats {
  activeDonors: number;
  livesSaved: number;
  hospitals: number;
  successRate: number;
  totalDonors: number;
  activeRequests: number;
  fulfilledCases: number;
}

const FALLBACK_STATS: AppStats = {
  activeDonors: 12000,
  livesSaved: 45000,
  hospitals: 1200,
  successRate: 99,
  totalDonors: 15000,
  activeRequests: 45,
  fulfilledCases: 1200
};

export const fetchAppStats = async (): Promise<AppStats> => {
  if (!isSupabaseConfigured()) {
    return FALLBACK_STATS;
  }

  try {
    // Fetch all counts in parallel for better performance and to catch network errors early
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const [
      activeDonorsRes,
      totalDonorsRes,
      donationRes,
      hospitalsRes,
      fulfilledRes,
      totalRequestsRes,
      activeRequestsRes
    ] = await Promise.all([
      supabase.from('donors').select('*', { count: 'exact', head: true }).in('availability', ['Available', 'Emergency Only']),
      supabase.from('donors').select('*', { count: 'exact', head: true }),
      supabase.from('donors').select('total_donations'),
      supabase.from('hospitals').select('*', { count: 'exact', head: true }),
      supabase.from('emergency_requests').select('*', { count: 'exact', head: true }).eq('status', 'Fulfilled'),
      supabase.from('emergency_requests').select('*', { count: 'exact', head: true }),
      supabase.from('emergency_requests').select('*', { count: 'exact', head: true }).eq('status', 'Active').gte('needed_date', today)
    ]);

    // Check for errors in any of the responses
    if (activeDonorsRes.error) throw activeDonorsRes.error;
    if (totalDonorsRes.error) throw totalDonorsRes.error;
    if (donationRes.error) throw donationRes.error;
    if (hospitalsRes.error) throw hospitalsRes.error;
    if (fulfilledRes.error) throw fulfilledRes.error;
    if (totalRequestsRes.error) throw totalRequestsRes.error;
    if (activeRequestsRes.error) throw activeRequestsRes.error;

    const totalDonations = donationRes.data?.reduce((sum, donor) => sum + (donor.total_donations || 0), 0) || 0;
    const livesSaved = totalDonations * 3;

    const totalRequestsCount = totalRequestsRes.count || 0;
    const fulfilledCount = fulfilledRes.count || 0;
    const successRate = totalRequestsCount > 0
      ? Math.round((fulfilledCount / totalRequestsCount) * 100) 
      : 99;

    return {
      activeDonors: activeDonorsRes.count || 0,
      livesSaved: livesSaved || 0,
      hospitals: hospitalsRes.count || 0,
      successRate: successRate,
      totalDonors: totalDonorsRes.count || 0,
      activeRequests: activeRequestsRes.count || 0,
      fulfilledCases: fulfilledCount
    };
  } catch (error: any) {
    // Only log if it's not a common "Failed to fetch" which we already know is likely a config issue
    if (error?.message === 'Failed to fetch') {
      useErrorStore.getState().setFetchError(true);
    } else {
      console.error('Error fetching app stats:', error);
    }
    return FALLBACK_STATS;
  }
};
