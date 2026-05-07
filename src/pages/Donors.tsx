import React, { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, 
  Filter, 
  Map as MapIcon, 
  List, 
  ChevronDown,
  Droplets,
  MapPin,
  X,
  SlidersHorizontal,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Donor, Hospital, TokenTransaction } from '@/src/types';
import { DonorListItem } from '@/src/components/DonorListItem';
import { DonorMap } from '@/src/components/DonorMap';
import { DISTRICTS, BLOOD_TYPES, THANAS_BY_DISTRICT } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useErrorStore } from '@/src/lib/errorTracking';

const Donors = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const { setFetchError } = useErrorStore();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const { t, language } = useLanguage();

  const [filters, setFilters] = useState({
    search: '',
    blood_type: '',
    district: '',
    thana: '',
    availability: '',
    organ_donor: false
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchDonors = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setDonors([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch donors
      let query = supabase
        .from('donors')
        .select('*')
        .order('verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.blood_type) query = query.eq('blood_type', filters.blood_type);
      if (filters.district) query = query.eq('district', filters.district);
      if (filters.thana) query = query.eq('thana', filters.thana);
      
      // If no availability filter is selected, default to showing Available and Emergency Only
      if (filters.availability) {
        query = query.eq('availability', filters.availability);
      } else {
        // By default, don't show "Not Available" donors in the search results
        query = query.neq('availability', 'Not Available');
      }

      if (debouncedSearch) {
        const searchTerm = `%${debouncedSearch}%`;
        query = query.or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},district.ilike.${searchTerm},thana.ilike.${searchTerm}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDonors(data || []);
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
        console.warn('Supabase fetch failed. Check your internet connection or Supabase URL.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [filters.blood_type, filters.district, filters.thana, filters.availability, filters.organ_donor, debouncedSearch]);

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      blood_type: '',
      district: '',
      thana: '',
      availability: '',
      organ_donor: false
    });
  };

  const availableThanas = filters.district ? (THANAS_BY_DISTRICT[filters.district as keyof typeof THANAS_BY_DISTRICT] || []) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-6 md:mb-8">
        <div className="w-full md:w-auto text-center md:text-left space-y-2 md:space-y-3">
          <h1 className="text-4xl md:text-[6rem] font-black text-on-surface tracking-tighter leading-[0.8] md:leading-[0.75]">{t('donors.title')}</h1>
          <p className="text-sm md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-70">
            {language === 'en' ? `Search across ${donors.length} registered donors in Bangladesh.` : `সারা বাংলাদেশে ${donors.length} জন নিবন্ধিত দাতাদের মধ্যে খুঁজুন।`}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low p-2 md:p-3 rounded-[2rem] md:rounded-[3rem] border border-surface-container-medium shadow-inner">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-3 px-6 md:px-10 py-3 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] text-sm md:text-2xl font-black transition-all",
              viewMode === 'list' ? "bg-white shadow-xl text-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <List className="w-5 h-5 md:w-8 md:h-8" /> {t('donors.view.list')}
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={cn(
              "flex items-center gap-3 px-6 md:px-10 py-3 md:py-5 rounded-[1.5rem] md:rounded-[2.5rem] text-sm md:text-2xl font-black transition-all",
              viewMode === 'map' ? "bg-white shadow-xl text-primary" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <MapIcon className="w-5 h-5 md:w-8 md:h-8" /> {t('donors.view.map')}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-16 md:top-24 z-30 bg-white/90 backdrop-blur-2xl p-2 md:p-4 rounded-[2rem] md:rounded-[3rem] border border-surface-container-medium shadow-2xl shadow-black/5 mb-4 md:mb-6 flex items-center gap-2 md:gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 text-on-surface-variant opacity-40" />
          <input 
            placeholder={t('donors.search_area')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 md:pl-16 pr-4 py-3 md:py-5 bg-surface-container-low rounded-xl md:rounded-2xl border-4 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold text-sm md:text-xl placeholder:text-on-surface-variant/30"
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
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-64 md:w-80 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-surface-container-medium p-4 md:p-6 z-50 space-y-4"
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
                      {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => setShowLocationDropdown(false)}
                    className="w-full py-3 bg-primary text-white rounded-xl font-black text-sm md:text-base shadow-lg shadow-red-100 active:scale-95 transition-transform"
                  >
                    {t('common.apply') || 'Apply'}
                  </button>
                </motion.div>
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

        {(filters.blood_type || filters.district || filters.availability || filters.organ_donor) && (
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
            className="overflow-hidden mb-6 md:mb-8"
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
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('common.available')}</label>
                <select 
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="w-full p-3.5 md:p-5 bg-white rounded-xl md:rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-lg shadow-sm"
                >
                  <option value="">{t('donors.filter.any_status')}</option>
                  <option value="Available">{t('common.available')}</option>
                  <option value="Emergency Only">{t('donors.filter.emergency_only')}</option>
                  <option value="Not Available">{t('common.unavailable')}</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4 md:pt-8">
                <input 
                  type="checkbox"
                  id="organ_donor_filter"
                  checked={filters.organ_donor}
                  onChange={(e) => handleFilterChange('organ_donor', e.target.checked)}
                  className="w-5 h-5 md:w-7 md:h-7 rounded-xl accent-primary cursor-pointer"
                />
                <label htmlFor="organ_donor_filter" className="font-black text-on-surface cursor-pointer text-sm md:text-lg">
                  {t('donors.filter.organ_only')}
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 md:h-32 bg-surface-container-low animate-pulse rounded-xl md:rounded-2xl" />
            ))}
          </motion.div>
        ) : viewMode === 'list' ? (
          donors.length > 0 ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 md:gap-3"
            >
              {donors.map(donor => (
                <DonorListItem 
                  key={donor.id} 
                  donor={donor} 
                />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoResults clearFilters={clearFilters} t={t} />
            </motion.div>
          )
        ) : (
          <motion.div 
            key="map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <DonorMap 
              donors={donors} 
              selectedDistrict={filters.district}
              selectedThana={filters.thana}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NoResults = ({ clearFilters, t }: { clearFilters: () => void, t: (key: string) => string }) => (
  <div className="text-center py-12 md:py-24">
    <div className="w-20 h-20 md:w-32 md:h-32 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6 md:mb-10">
      <SearchIcon className="w-8 h-8 md:w-12 md:h-12 text-on-surface-variant/20" />
    </div>
    <h3 className="text-2xl md:text-4xl font-black text-on-surface mb-2 md:mb-4 tracking-tight">{t('donors.no_results.title')}</h3>
    <p className="text-sm md:text-xl text-on-surface-variant font-medium max-w-md mx-auto">{t('donors.no_results.subtitle')}</p>
    <button 
      onClick={clearFilters}
      className="mt-8 md:mt-12 px-8 py-4 md:px-12 md:py-6 bg-primary text-white rounded-2xl md:rounded-3xl font-black shadow-xl shadow-red-200 hover:scale-105 active:scale-95 transition-all text-sm md:text-lg"
    >
      {t('donors.filter.clear_all')}
    </button>
  </div>
);

export default Donors;
