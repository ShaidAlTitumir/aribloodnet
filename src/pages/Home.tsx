import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Droplets, 
  Heart, 
  Hospital, 
  Users, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { EmergencyRequest } from '@/src/types';
import { EmergencyCard } from '@/src/components/EmergencyCard';
import { DISTRICTS, BLOOD_TYPES } from '@/src/lib/utils';
import { fetchAppStats, AppStats } from '@/src/lib/statsService';

import { cn } from '@/src/lib/utils';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useErrorStore } from '@/src/lib/errorTracking';

const Home = () => {
  const [recentEmergencies, setRecentEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const { setFetchError } = useErrorStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        const statsRes = await fetchAppStats();
        setStats(statsRes);
        setRecentEmergencies([]);
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // Cleanup expired requests (delete them so they are truly gone)
        // We delete any request where needed_date is in the past, regardless of status
        await supabase
          .from('emergency_requests')
          .delete()
          .lt('needed_date', today);

        const [emergenciesRes, statsRes] = await Promise.all([
          supabase
            .from('emergency_requests')
            .select('*')
            .eq('status', 'Active')
            .gte('needed_date', today)
            .order('created_at', { ascending: false })
            .limit(20), // Fetch more to allow location-based sorting
          fetchAppStats()
        ]);

        if (emergenciesRes.error) throw emergenciesRes.error;
        let fetchedEmergencies = emergenciesRes.data || [];

        // Prioritize user's location if available (excluding user's own posts from "Near You" priority)
        if (userProfile?.district) {
          fetchedEmergencies = [...fetchedEmergencies].sort((a, b) => {
            const currentUserId = userProfile.id; // userProfile.id is the same as auth user.id

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

            // Default: Newest first
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }

        setRecentEmergencies(fetchedEmergencies.slice(0, 3)); // Take only top 3 after sorting
        setStats(statsRes);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (err instanceof Error && err.message.includes('Failed to fetch')) {
          setFetchError(true);
          console.warn('Supabase fetch failed. Check your internet connection or Supabase URL.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the list
      setRecentEmergencies(prev => prev.filter(req => req.id !== id));
      const statsRes = await fetchAppStats();
      setStats(statsRes);
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request. Please try again.');
    }
  };

  const formatStatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    }
    return value.toString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 md:space-y-32 pb-12 md:pb-32">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-32 pb-12 md:pb-24 overflow-hidden bg-surface-container-lowest border-b border-surface-container-low rounded-b-[3rem] md:rounded-b-[6rem] shadow-2xl shadow-black/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-96 h-96 bg-red-200 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -45, 0],
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-orange-100 rounded-full blur-[150px]" 
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 text-center space-y-8 md:space-y-12">
          <div className="space-y-6 md:space-y-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-4"
            >
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-red-50 text-red-600 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] border border-red-100 shadow-sm">
                <Activity className="w-4 h-4 md:w-5 md:h-5" />
                <span>{t('hero.badge')}</span>
              </div>
              {stats && stats.activeRequests > 0 && (
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-orange-50 text-orange-600 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] border border-orange-100 shadow-sm animate-pulse">
                  <Droplets className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{stats.activeRequests} {t('stats.active_requests')}</span>
                </div>
              )}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-8xl font-black text-on-surface tracking-tighter mb-6 leading-tight md:leading-[1.2]"
            >
              {t('hero.title.part1')}<span className="text-primary">{t('hero.title.part2')}</span>
              <div className="h-2 md:h-6" />
              {t('hero.title.part3')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="max-w-3xl mx-auto text-base md:text-3xl text-on-surface-variant mb-10 md:mb-16 font-medium leading-relaxed opacity-80"
            >
              {t('hero.subtitle.home')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8"
            >
              <Link 
                to="/donors" 
                className="w-full sm:w-auto px-10 py-5 md:px-16 md:py-8 bg-primary text-white rounded-2xl md:rounded-[3rem] font-black shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all text-base md:text-2xl flex items-center justify-center gap-3"
              >
                {t('hero.cta.find')} <Search className="w-5 h-5 md:w-7 md:h-7" />
              </Link>
              <Link 
                to="/emergency" 
                className="w-full sm:w-auto px-10 py-5 md:px-16 md:py-8 bg-white text-on-surface border-2 border-surface-container-high rounded-2xl md:rounded-[3rem] font-black hover:bg-surface-container-low transition-all text-base md:text-2xl flex items-center justify-center gap-3"
              >
                {t('hero.cta.post')} <Droplets className="w-5 h-5 md:w-7 md:h-7 text-primary" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emergency Feed */}
      <section className="px-4 space-y-8 md:space-y-16">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="text-center md:text-left space-y-2 md:space-y-4">
            <h2 className="text-4xl md:text-8xl font-black text-on-surface tracking-tighter leading-none">{t('home.emergencies.title')}</h2>
            <p className="text-base md:text-3xl text-on-surface-variant font-medium opacity-70">{t('home.emergencies.subtitle')}</p>
          </div>
          <Link to="/emergency" className="group flex items-center gap-3 px-8 py-4 bg-surface-container-low text-primary font-black uppercase tracking-[0.2em] text-xs md:text-lg rounded-full hover:bg-primary hover:text-white transition-all">
            {t('home.emergencies.view_all')} <ArrowRight className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 md:h-96 bg-surface-container-low animate-pulse rounded-[2.5rem] md:rounded-[4rem]" />
              ))}
            </motion.div>
          ) : recentEmergencies.length > 0 ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
            >
              {recentEmergencies.map(req => (
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
              className="text-center py-20 md:py-40 bg-surface-container-low/30 rounded-[3rem] md:rounded-[6rem] border-4 border-dashed border-surface-container-high space-y-6"
            >
              <Droplets className="w-16 h-16 md:w-32 md:h-32 text-on-surface-variant/10 mx-auto" />
              <p className="text-xl md:text-4xl text-on-surface-variant font-black tracking-tight opacity-40">{t('home.emergencies.empty')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Stats Section */}
      <section className="px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
          {[
            { label: t('stats.active_donors'), value: stats ? formatStatValue(stats.activeDonors) : '...', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: t('stats.lives_saved'), value: stats ? formatStatValue(stats.livesSaved) : '...', icon: Heart, color: 'text-primary', bg: 'bg-red-50' },
            { label: t('stats.hospitals'), value: stats ? formatStatValue(stats.hospitals) : '...', icon: Hospital, color: 'text-secondary', bg: 'bg-green-50' },
            { label: t('stats.success_rate'), value: stats ? `${stats.successRate}%` : '...', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.7, 
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-surface-container-low shadow-xl shadow-black/5 flex flex-col items-center text-center gap-4 md:gap-8 hover:shadow-2xl transition-all group"
            >
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={cn("w-12 h-12 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-inner shrink-0 transition-transform duration-500", stat.bg)}
              >
                <stat.icon className={cn("w-6 h-6 md:w-12 md:h-12", stat.color)} />
              </motion.div>
              <div className="space-y-1 md:space-y-2">
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 1, delay: i * 0.15 + 0.3 }}
                  className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter leading-none"
                >
                  {stat.value}
                </motion.div>
                <div className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative editorial-gradient rounded-[3rem] md:rounded-[6rem] p-10 md:p-32 overflow-hidden shadow-2xl shadow-red-200 group"
        >
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] transition-transform group-hover:scale-110 duration-1000" />
          <div className="relative z-10 max-w-4xl space-y-8 md:space-y-12">
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-[8rem] font-black text-white leading-[0.85] tracking-tighter"
            >
              {t('home.cta.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-red-100 text-base md:text-3xl font-medium leading-relaxed opacity-90 max-w-2xl"
            >
              {t('home.cta.subtitle')}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-6 md:gap-12"
            >
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-12 py-6 md:px-20 md:py-10 bg-white text-primary rounded-2xl md:rounded-[3rem] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-base md:text-3xl text-center"
              >
                {t('home.cta.btn')}
              </Link>
              <div className="flex items-center gap-3 text-white/80 font-black text-xs md:text-xl uppercase tracking-[0.2em]">
                <ShieldCheck className="w-6 h-6 md:w-10 md:h-10" />
                <span>{t('home.cta.verified')}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
