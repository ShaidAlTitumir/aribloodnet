import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Search as SearchIcon, 
  MapPin, 
  Users, 
  ChevronRight,
  X,
  CheckCircle2,
  ArrowRight,
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Group } from '@/src/types';
import { DISTRICTS, THANAS_BY_DISTRICT, cn } from '@/src/lib/utils';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useErrorStore } from '@/src/lib/errorTracking';

const Groups = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setFetchError } = useErrorStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    district: '',
    thana: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    district: '',
    thana: '',
    logo_url: '',
    facebook_url: '',
    website_url: ''
  });

  const fetchGroups = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('groups')
        .select(`
          *,
          member_count:group_members(count)
        `)
        .order('created_at', { ascending: false });

      if (filters.district) query = query.eq('district', filters.district);
      if (filters.thana) query = query.eq('thana', filters.thana);
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to include member count properly
      const transformedGroups = (data || []).map(g => ({
        ...g,
        member_count: g.member_count?.[0]?.count || 0
      }));

      setGroups(transformedGroups);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filters.district, filters.thana]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGroups();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleModalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'district') {
      setFormData(prev => ({ ...prev, [name]: value, thana: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    try {
      // Ensure profile exists (fix for foreign key constraint error)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: user.user_metadata?.full_name || 'New User',
            email: user.email || ''
          }]);
        if (createProfileError) throw createProfileError;
      } else if (profileError) {
        throw profileError;
      }

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{
          ...formData,
          created_by: user.id
        }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Automatically add creator as Admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupData.id,
          user_id: user.id,
          role: 'Admin'
        }]);

      if (memberError) throw memberError;

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setFormData({ name: '', description: '', district: '', thana: '', logo_url: '', facebook_url: '', website_url: '' });
        fetchGroups();
      }, 2000);
    } catch (err: any) {
      console.error('Error creating group:', err);
      alert(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const availableThanas = formData.district ? THANAS_BY_DISTRICT[formData.district] || [] : [];
  const filterThanas = filters.district ? THANAS_BY_DISTRICT[filters.district] || [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border border-blue-100 shadow-sm">
            <Building2 className="w-4 h-4" />
            <span>{t('nav.groups')}</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter leading-none">
            {t('groups.title')}
          </h1>
          <p className="text-sm md:text-lg text-on-surface-variant font-medium max-w-2xl leading-relaxed opacity-80">
            {t('groups.subtitle')}
          </p>
        </div>

        <button 
          onClick={() => user ? setShowModal(true) : navigate('/auth')}
          className="w-full md:w-auto px-6 py-4 md:px-10 md:py-5 bg-primary text-white rounded-2xl md:rounded-[2rem] font-black shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-base md:text-lg flex items-center justify-center gap-4 shrink-0"
        >
          <PlusCircle className="w-6 h-6 md:w-8 md:h-8" />
          {t('groups.create_btn')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/90 backdrop-blur-2xl p-2 md:p-4 rounded-[2rem] md:rounded-[3rem] border border-surface-container-medium shadow-2xl shadow-black/5 flex items-center gap-2 md:gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 text-on-surface-variant opacity-40" />
          <input 
            placeholder={t('groups.search_placeholder')}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 md:pl-16 pr-4 py-2.5 md:py-4 bg-surface-container-low rounded-xl md:rounded-2xl border-4 border-transparent focus:border-primary focus:bg-white outline-none transition-all font-bold text-sm md:text-xl placeholder:text-on-surface-variant/30"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Location Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className={cn(
                "px-3 py-2.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all flex items-center gap-2 md:gap-3 text-xs md:text-lg border-4 border-transparent",
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
                      onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value, thana: '' }))}
                      className="w-full p-3 md:p-4 bg-surface-container-low rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-base"
                    >
                      <option value="">{t('groups.filter.all_districts')}</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('donors.filter.thana')}</label>
                    <select 
                      value={filters.thana}
                      onChange={(e) => setFilters(prev => ({ ...prev, thana: e.target.value }))}
                      disabled={!filters.district}
                      className="w-full p-3 md:p-4 bg-surface-container-low rounded-xl font-bold outline-none border-2 border-transparent focus:border-primary text-sm md:text-base disabled:opacity-50"
                    >
                      <option value="">{filters.district ? t('groups.filter.all_thanas') : '---'}</option>
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-surface-container-low animate-pulse rounded-[1.5rem] md:rounded-[2rem]" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {groups.map(group => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-surface-container-low shadow-md shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-8"
            >
              <div className="flex flex-row items-start gap-4 flex-1 min-w-0">
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/groups/${group.id}`} className="hover:underline">
                      <h3 className="text-xl md:text-3xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {group.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full text-on-surface-variant font-black text-[10px] md:text-xs uppercase tracking-wider">
                      <Users className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{group.member_count} {t('groups.card.members')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-base text-on-surface-variant font-bold opacity-70">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                      <span>{group.thana}, {group.district}</span>
                    </div>
                  </div>

                  <p className="text-on-surface-variant text-xs md:text-sm line-clamp-1 md:line-clamp-2 leading-relaxed font-medium max-w-3xl opacity-80">
                    {group.description || 'No description provided.'}
                  </p>
                </div>

                {/* Group Logo */}
                <div className="shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-2xl bg-surface-container-low border border-surface-container-medium flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                  {group.logo_url ? (
                    <img 
                      src={group.logo_url} 
                      alt={group.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const iconDiv = document.createElement('div');
                          iconDiv.className = "w-full h-full flex items-center justify-center bg-primary/5 text-primary";
                          iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 md:w-12 md:h-12"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
                          parent.appendChild(iconDiv);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <Users className="w-8 h-8 md:w-12 md:h-12" />
                    </div>
                  )}
                </div>
              </div>

              <Link 
                to={`/groups/${group.id}`}
                className="w-full md:w-auto px-6 py-3 md:px-10 md:py-5 bg-surface-container-low text-on-surface hover:bg-primary hover:text-white rounded-xl md:rounded-2xl font-black transition-all flex items-center justify-center gap-3 group/btn shrink-0 text-sm md:text-lg shadow-sm"
              >
                {t('groups.card.view_group')}
                <ChevronRight className="w-4 h-4 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 md:py-40 bg-surface-container-low rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-surface-container-medium">
          <Building2 className="w-16 h-16 md:w-24 md:h-24 text-on-surface-variant/20 mx-auto mb-8" />
          <h3 className="text-2xl md:text-4xl font-black text-on-surface mb-4 tracking-tight">
            {t('groups.no_results.title')}
          </h3>
          <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70">
            {t('groups.no_results.subtitle')}
          </p>
        </div>
      )}

      {/* Register Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {success ? (
                <div className="p-12 md:p-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter">{t('groups.modal.success.title')}</h2>
                    <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70">{t('groups.modal.success.subtitle')}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                  <div className="p-8 md:p-10 border-b flex justify-between items-center bg-surface-container-low">
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter">{t('groups.modal.title')}</h2>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">{t('groups.modal.subtitle')}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="p-3 hover:bg-surface-container-medium rounded-2xl transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-8 md:p-12 overflow-y-auto space-y-8 flex-1">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.name')}</label>
                      <input 
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleModalChange}
                        placeholder={t('groups.modal.name_placeholder')}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.description')}</label>
                      <textarea 
                        required
                        name="description"
                        value={formData.description}
                        onChange={handleModalChange}
                        placeholder={t('groups.modal.description_placeholder')}
                        rows={4}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.district')}</label>
                        <select 
                          required
                          name="district"
                          value={formData.district}
                          onChange={handleModalChange}
                          className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none appearance-none"
                        >
                          <option value="">{t('common.select')}</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.thana')}</label>
                        <select 
                          required
                          name="thana"
                          value={formData.thana}
                          onChange={handleModalChange}
                          disabled={!formData.district}
                          className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none appearance-none disabled:opacity-50"
                        >
                          <option value="">{formData.district ? t('common.select') : '---'}</option>
                          {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
                          {t('groups.modal.facebook')}
                        </label>
                        <input 
                          name="facebook_url"
                          value={formData.facebook_url}
                          onChange={handleModalChange}
                          placeholder="https://facebook.com/yourgroup"
                          className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
                          {t('groups.modal.website')}
                        </label>
                        <input 
                          name="website_url"
                          value={formData.website_url}
                          onChange={handleModalChange}
                          placeholder="https://yourgroup.org"
                          className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
                        {t('groups.modal.logo_url')}
                        <Info className="w-3 h-3 opacity-40" />
                      </label>
                      <input 
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleModalChange}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-8 md:p-12 border-t bg-surface-container-low">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                    >
                      {submitting ? t('common.loading') : t('groups.modal.submit')}
                      {!submitting && <ArrowRight className="w-6 h-6" />}
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

export default Groups;
