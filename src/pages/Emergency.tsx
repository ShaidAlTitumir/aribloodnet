import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  PlusCircle, 
  Droplets, 
  Hospital, 
  MapPin, 
  Phone, 
  User, 
  Clock,
  Activity,
  CheckCircle2,
  X,
  ArrowRight,
  ChevronDown,
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
  Search as SearchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { EmergencyRequest } from '@/src/types';
import { EmergencyCard } from '@/src/components/EmergencyCard';
import { DISTRICTS, BLOOD_TYPES, THANAS_BY_DISTRICT, geocodeLocation } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import { fetchAppStats, AppStats } from '@/src/lib/statsService';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/src/types';
import { useErrorStore } from '@/src/lib/errorTracking';

const Emergency = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { setFetchError } = useErrorStore();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  const [filters, setFilters] = useState({
    search: '',
    blood_type: '',
    district: '',
    thana: '',
    urgency: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const [formData, setFormData] = useState({
    blood_type_needed: '',
    patient_name: '',
    hospital_name: '',
    reason: '',
    needed_date: '',
    district: '',
    thana: '',
    urgency: 'Urgent',
    contact_number: '',
    bags_needed: '1',
  });

  const fetchRequests = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      const statsRes = await fetchAppStats();
      setStats(statsRes);
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Delete expired requests (any status) - only if authenticated
      if (user) {
        await supabase
          .from('emergency_requests')
          .delete()
          .lt('needed_date', today);
      }

      const [requestsRes, statsRes] = await Promise.all([
        (async () => {
          let query = supabase
            .from('emergency_requests')
            .select('*')
            .eq('status', 'Active')
            .gte('needed_date', today)
            .order('created_at', { ascending: false });

          if (filters.blood_type) query = query.eq('blood_type_needed', filters.blood_type);
          if (filters.district) query = query.eq('district', filters.district);
          if (filters.thana) query = query.eq('thana', filters.thana);
          if (filters.urgency) query = query.eq('urgency', filters.urgency);

          if (debouncedSearch) {
            const searchTerm = `%${debouncedSearch}%`;
            query = query.or(`patient_name.ilike.${searchTerm},hospital_name.ilike.${searchTerm},reason.ilike.${searchTerm},district.ilike.${searchTerm},thana.ilike.${searchTerm}`);
          }

          const result = await query;
          if (result.error) {
            console.error('Supabase query error:', result.error);
          }
          return result;
        })(),
        fetchAppStats()
      ]);

      if (requestsRes.error) throw requestsRes.error;
      let fetchedRequests = requestsRes.data || [];

      // Prioritize user's location if available (excluding user's own posts from "Near You" priority)
      if (userProfile?.district) {
        fetchedRequests = [...fetchedRequests].sort((a, b) => {
          const currentUserId = user?.id;

          // Priority 1: Same District AND Same Thana (only for other users' posts)
          const aMatchBoth = a.district === userProfile.district && a.thana === userProfile.thana && a.user_id !== currentUserId;
          const bMatchBoth = b.district === userProfile.district && b.thana === userProfile.thana && b.user_id !== currentUserId;
          if (aMatchBoth && !bMatchBoth) return -1;
          if (!aMatchBoth && bMatchBoth) return 1;

          // Priority 2: Same District (only for other users' posts)
          const aMatchDistrict = a.district === userProfile.district && a.user_id !== currentUserId;
          const bMatchDistrict = b.district === userProfile.district && b.user_id !== currentUserId;
          if (aMatchDistrict && !bMatchDistrict) return -1;
          if (!aMatchDistrict && bMatchDistrict) return 1;

          // Priority 3: Urgency (Critical > Urgent > Within 24 hours)
          const urgencyOrder = { 'Critical': 0, 'Urgent': 1, 'Within 24 hours': 2 };
          const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3;
          const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3;
          if (aUrgency !== bUrgency) return aUrgency - bUrgency;

          // Default: Newest first (already sorted by query, but good to have as fallback)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      setRequests(fetchedRequests);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
        console.warn('Supabase fetch failed. Check your internet connection or Supabase URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters.blood_type, filters.district, filters.thana, filters.urgency, debouncedSearch, userProfile]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the list
      fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request. Please try again.');
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      blood_type: '',
      district: '',
      thana: '',
      urgency: ''
    });
  };

  const filterThanas = filters.district ? THANAS_BY_DISTRICT[filters.district] || [] : [];

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [showModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset thana if district changes
    if (name === 'district') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        thana: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const availableThanas = formData.district ? THANAS_BY_DISTRICT[formData.district] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to post an emergency request.');
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    try {
      // Geocode location
      const coords = await geocodeLocation(formData.thana, formData.district);

      const { error } = await supabase
        .from('emergency_requests')
        .insert([{
          ...formData,
          bags_needed: parseInt(formData.bags_needed) || 1,
          user_id: user.id,
          status: 'Active',
          latitude: coords?.lat || null,
          longitude: coords?.lon || null
        }]);

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        fetchRequests();
      }, 2000);
    } catch (err: any) {
      console.error('Error posting request:', err);
      let message = err.message || 'Failed to post request. Please try again.';
      if (message === 'Failed to fetch') {
        message = 'Could not connect to the database. Please check your internet connection or Supabase configuration.';
      }
      alert(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k+';
    }
    return value.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="text-center md:text-left space-y-2 md:space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-red-100 shadow-sm">
            <Activity className="w-3.5 h-3.5" />
            <span>{t('emergency.live_feed')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter leading-none">{t('emergency.title')}</h1>
          <p className="text-xs md:text-lg text-on-surface-variant font-medium max-w-2xl leading-relaxed opacity-80">
            {t('emergency.subtitle')}
          </p>
        </div>

        <button 
          onClick={() => {
            if (!user) {
              navigate('/auth');
            } else {
              setShowModal(true);
            }
          }}
          className="w-full md:w-auto px-6 py-4 md:px-10 md:py-5 bg-primary text-white rounded-xl md:rounded-[1.5rem] font-black shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-lg flex items-center justify-center gap-3 emergency-pulse shrink-0"
        >
          <PlusCircle className="w-5 h-5 md:w-6 md:h-6" />
          {t('emergency.post_new')}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/90 backdrop-blur-2xl p-2 md:p-4 rounded-[2rem] md:rounded-[3rem] border border-surface-container-medium shadow-2xl shadow-black/5 flex items-center gap-2 md:gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 text-on-surface-variant opacity-40" />
          <input 
            placeholder={t('emergency.search_placeholder') || "Search requests..."}
            value={filters.search}
            className="w-full pl-10 md:pl-16 pr-4 py-3 md:py-5 bg-surface-container-low rounded-xl md:rounded-2xl border-4 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold text-sm md:text-xl placeholder:text-on-surface-variant/30"
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Blood Type Select (Hidden on mobile, visible on desktop) */}
          <div className="hidden lg:block">
            <select 
              value={filters.blood_type}
              onChange={(e) => handleFilterChange('blood_type', e.target.value)}
              className="px-4 py-3 md:py-5 bg-surface-container-low rounded-xl md:rounded-2xl font-bold outline-none border-4 border-transparent focus:border-primary text-xs md:text-lg appearance-none cursor-pointer hover:bg-surface-container-medium transition-colors"
            >
              <option value="">{t('donors.filter.all_blood')}</option>
              {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className={cn(
                "px-3 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl font-bold transition-all flex items-center gap-2 md:gap-3 text-xs md:text-lg border-4 border-transparent",
                showLocationDropdown || filters.district ? "bg-primary text-white shadow-lg shadow-red-200" : "bg-surface-container-low text-on-surface hover:bg-surface-container-medium"
              )}
            >
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">
                {filters.district ? `${filters.thana || filters.district}` : t('donors.filter.location')}
              </span>
              <ChevronDown className={cn("w-3 h-3 md:w-4 md:h-4 transition-transform", showLocationDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showLocationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[90] bg-black/5 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none" 
                    onClick={() => setShowLocationDropdown(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-64 md:w-80 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-surface-container-medium p-4 md:p-6 z-[100] space-y-4"
                  >
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('donors.filter.district')}</label>
                    <select 
                      value={filters.district}
                      onChange={(e) => {
                        handleFilterChange('district', e.target.value);
                        handleFilterChange('thana', '');
                      }}
                      className="w-full p-3 md:p-4 bg-surface-container-low rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-base"
                    >
                      <option value="">{t('donors.filter.all_districts')}</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('donors.filter.thana')}</label>
                    <select 
                      value={filters.thana}
                      onChange={(e) => handleFilterChange('thana', e.target.value)}
                      disabled={!filters.district}
                      className="w-full p-3 md:p-4 bg-surface-container-low rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-base disabled:opacity-50"
                    >
                      <option value="">{filters.district ? t('donors.filter.all_thanas') : '---'}</option>
                      {filterThanas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => setShowLocationDropdown(false)}
                    className="w-full py-3 bg-primary text-white rounded-xl font-black text-sm md:text-base shadow-lg shadow-red-100 active:scale-95 transition-transform"
                  >
                    {t('common.apply') || 'Apply'}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>

          {/* Advanced Filters Toggle */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-3 md:p-5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 font-bold text-xs md:text-lg",
              showFilters ? "bg-on-surface text-white" : "bg-surface-container-low text-on-surface hover:bg-surface-container-medium"
            )}
          >
            <SlidersHorizontal className="w-4 h-4 md:w-6 md:h-6" />
            <span className="hidden sm:inline">{t('donors.filter.btn')}</span>
          </button>
        </div>

        {(filters.blood_type || filters.district || filters.thana || filters.urgency) && (
          <button 
            onClick={clearFilters}
            className="text-primary font-black text-[10px] md:text-sm uppercase tracking-widest hover:underline px-2"
          >
            {t('donors.filter.clear')}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="p-6 md:p-10 bg-surface-container-low rounded-[2rem] md:rounded-[3rem] grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 border border-surface-container-medium">
              <div className="space-y-2 lg:hidden">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('donors.filter.blood_type')}</label>
                <select 
                  value={filters.blood_type}
                  onChange={(e) => handleFilterChange('blood_type', e.target.value)}
                  className="w-full p-3.5 md:p-5 bg-white rounded-xl md:rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-lg shadow-sm"
                >
                  <option value="">{t('donors.filter.all_blood')}</option>
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('emergency.modal.urgency')}</label>
                <select 
                  value={filters.urgency}
                  onChange={(e) => handleFilterChange('urgency', e.target.value)}
                  className="w-full p-3.5 md:p-5 bg-white rounded-xl md:rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-lg shadow-sm"
                >
                  <option value="">{t('donors.filter.any_status')}</option>
                  <option value="Urgent">{t('emergency.modal.urgency_urgent')}</option>
                  <option value="Critical">{t('emergency.modal.urgency_critical')}</option>
                  <option value="Within 24 hours">{t('emergency.modal.urgency_24h')}</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border border-surface-container-low shadow-lg shadow-black/5 flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-red-50 rounded-lg md:rounded-xl flex items-center justify-center text-primary shrink-0 shadow-sm">
            <AlertCircle className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-lg md:text-3xl font-black text-on-surface leading-none mb-1">
              {stats ? stats.activeRequests : '...'}
            </div>
            <div className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{t('emergency.active_requests')}</div>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-[1.25rem] md:rounded-[1.5rem] border border-surface-container-low shadow-lg shadow-black/5 flex items-center gap-3 md:gap-5">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-green-50 rounded-lg md:rounded-xl flex items-center justify-center text-green-600 shrink-0 shadow-sm">
            <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-lg md:text-3xl font-black text-on-surface leading-none mb-1">
              {stats ? formatStatValue(stats.fulfilledCases) : '...'}
            </div>
            <div className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{t('emergency.fulfilled')}</div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 md:h-64 bg-surface-container-low animate-pulse rounded-[2rem] md:rounded-[2.5rem]" />
            ))}
          </motion.div>
        ) : requests.length > 0 ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {requests.map(req => (
              <EmergencyCard 
                key={req.id} 
                request={req} 
                onDelete={handleDelete} 
                userLocation={userProfile}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 md:py-40 bg-surface-container-low rounded-[2.5rem] md:rounded-[4rem] border-4 border-dashed border-surface-container-medium"
          >
            <Droplets className="w-12 h-12 md:w-20 md:h-20 text-on-surface-variant/20 mx-auto mb-6 md:mb-10" />
            <h3 className="text-2xl md:text-4xl font-black text-on-surface mb-2 md:mb-4 tracking-tight">
              {filters.search ? t('emergency.no_search_results.title') || "No matches found" : t('emergency.no_requests.title')}
            </h3>
            <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70">
              {filters.search ? (t('emergency.no_search_results.subtitle') || `We couldn't find any requests matching "${filters.search}"`) : t('emergency.no_requests.subtitle')}
            </p>
            {filters.search && (
              <button 
                onClick={clearFilters}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-black text-sm md:text-lg shadow-lg shadow-red-200 hover:scale-105 transition-all"
              >
                {t('donors.filter.clear')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md touch-none"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col border border-white/20 overscroll-contain min-h-0"
            >
              {success ? (
                <div className="p-12 md:p-20 text-center space-y-6">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 md:w-16 md:h-16 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter">{t('emergency.modal.success.title')}</h2>
                    <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70">{t('emergency.modal.success.subtitle')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                  <div className="p-6 md:p-10 border-b flex justify-between items-center bg-surface-container-low">
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter leading-none">{t('emergency.modal.title')}</h2>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">{t('emergency.modal.subtitle')}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="p-3 md:p-4 hover:bg-surface-container-medium rounded-2xl md:rounded-3xl transition-all active:scale-90"
                    >
                      <X className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                  </div>

                  <div className="p-6 md:p-12 overflow-y-auto space-y-6 md:space-y-10 flex-1">
                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('emergency.modal.blood_type')}</label>
                        <div className="relative">
                          <select 
                            required
                            name="blood_type_needed"
                            value={formData.blood_type_needed}
                            onChange={handleChange}
                            className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none pr-10"
                          >
                            <option value="">{t('register.blood_type_placeholder')}</option>
                            {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t('emergency.modal.date')}
                        </label>
                        <input 
                          required
                          type="date"
                          name="needed_date"
                          min={(() => {
                            const now = new Date();
                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                          })()}
                          value={formData.needed_date}
                          onChange={handleChange}
                          className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          {t('emergency.modal.bags_needed')}
                        </label>
                        <input 
                          required
                          type="number"
                          name="bags_needed"
                          min="1"
                          max="20"
                          value={formData.bags_needed}
                          onChange={handleChange}
                          className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('emergency.modal.reason')}
                      </label>
                      <input 
                        required
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder={t('emergency.modal.reason_placeholder')}
                        className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {t('emergency.modal.patient_name')}
                        </label>
                        <input 
                          required
                          name="patient_name"
                          value={formData.patient_name}
                          onChange={handleChange}
                          placeholder={t('emergency.modal.patient_placeholder')}
                          className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {t('emergency.modal.urgency')}
                        </label>
                        <div className="relative">
                          <select 
                            required
                            name="urgency"
                            value={formData.urgency}
                            onChange={handleChange}
                            className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none pr-10"
                          >
                            <option value="Urgent">{t('emergency.modal.urgency_urgent')}</option>
                            <option value="Critical">{t('emergency.modal.urgency_critical')}</option>
                            <option value="Within 24 hours">{t('emergency.modal.urgency_24h')}</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                        <Hospital className="w-3 h-3" />
                        {t('emergency.modal.hospital')}
                      </label>
                      <input 
                        required
                        name="hospital_name"
                        value={formData.hospital_name}
                        onChange={handleChange}
                        placeholder={t('emergency.modal.hospital_placeholder')}
                        className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {t('emergency.modal.district')}
                        </label>
                        <div className="relative">
                          <select 
                            required
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none pr-10"
                          >
                            <option value="">{t('register.district_placeholder')}</option>
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {t('emergency.modal.thana')}
                        </label>
                        <div className="relative">
                          <select 
                            required
                            name="thana"
                            value={formData.thana}
                            onChange={handleChange}
                            disabled={!formData.district}
                            className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none pr-10 disabled:opacity-50"
                          >
                            <option value="">{formData.district ? t('register.thana_placeholder') : '---'}</option>
                            {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                            {formData.district && availableThanas.length === 0 && (
                              <option value="Other">Other / Not Listed</option>
                            )}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="w-5 h-5 text-on-surface-variant" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {t('emergency.modal.contact')}
                      </label>
                      <input 
                        required
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder={t('emergency.modal.contact_placeholder')}
                        className="w-full px-5 py-4 md:py-5 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 md:p-12 border-t bg-surface-container-low">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-5 md:py-8 bg-primary text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-2xl shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                      {submitting ? t('emergency.modal.submitting') : t('emergency.modal.submit')}
                      {!submitting && <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Emergency;
