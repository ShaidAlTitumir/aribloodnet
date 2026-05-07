import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Droplets, 
  ChevronLeft,
  Share2,
  Heart,
  Activity,
  Clock,
  User,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Donor } from '@/src/types';
import { format } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useErrorStore } from '@/src/lib/errorTracking';
import { useAuth } from '@/src/hooks/useAuth';

import { DonorBadge } from '@/src/components/DonorBadge';

const DonorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setFetchError } = useErrorStore();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (user && donor && user.id === donor.user_id) {
      setIsOwnProfile(true);
    } else {
      setIsOwnProfile(false);
    }
  }, [user, donor]);

  const fetchDonor = async () => {
    if (!id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*, profiles!inner(is_donor)')
        .or(`id.eq.${id},user_id.eq.${id}`)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDonor(data);
      } else {
        // If not found in donors table, try to fetch from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        if (profileData) {
          // Create a donor-like object from profile data
          const mockDonor: any = {
            ...profileData,
            user_id: profileData.id,
            availability: 'Not Available',
            verified: false,
            medical_conditions: null,
            organ_donor: false,
            latitude: null,
            longitude: null
          };
          setDonor(mockDonor);
        }
      }
    } catch (err: any) {
      console.error('Error fetching donor:', err);
      // If it's a fetch error, it might be due to credentials
      if (err instanceof Error && err.message.includes('fetch')) {
        setFetchError(true);
        console.error('Network error or Supabase connection failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonor();
  }, [id]);

  const updateAvailability = async (newStatus: Donor['availability']) => {
    if (!donor || isUpdating || !isSupabaseConfigured()) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({ availability: newStatus })
        .eq('id', donor.id);

      if (error) throw error;
      
      setDonor(prev => prev ? { ...prev, availability: newStatus } : null);
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleShare = async () => {
    if (!donor) return;
    
    const shareData = {
      title: `${donor.full_name} - Blood Donor (${donor.blood_type})`,
      text: `Check out this blood donor on BloodLink BD: ${donor.full_name} (${donor.blood_type}) from ${donor.thana}, ${donor.district}.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-on-surface-variant font-bold">{t('donor.profile.loading')}</p>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-on-surface mb-4">{t('donor.profile.not_found')}</h2>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-black"
        >
          {t('donor.profile.go_back')}
        </button>
      </div>
    );
  }

  const formatHeight = (cm: number | null) => {
    if (!cm) return 'N/A';
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return `${ft}' ${inch}"`;
  };

  const bmi = donor.weight_kg && donor.height_cm 
    ? (donor.weight_kg / Math.pow(donor.height_cm / 100, 2)).toFixed(1) 
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 md:pb-20 space-y-6 md:space-y-10">
      {/* Header Navigation */}
      <div className="flex items-center justify-between py-4 md:py-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm border border-surface-container-low text-on-surface-variant hover:text-primary transition-all hover:bg-surface-container-low active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
        </button>
        <div className="flex gap-2 md:gap-3">
          <button 
            onClick={handleShare}
            className="p-2.5 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm border border-surface-container-low text-on-surface-variant hover:text-primary transition-all hover:bg-surface-container-low active:scale-90"
          >
            <Share2 className="w-5 h-5 md:w-7 md:h-7" />
          </button>
          <button className="p-2.5 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm border border-surface-container-low text-on-surface-variant hover:text-primary transition-all hover:bg-surface-container-low active:scale-90">
            <Heart className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-xl shadow-black/5 border border-surface-container-low relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-40 md:h-40 bg-primary rounded-3xl md:rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-xl shadow-red-100">
              <span className="text-3xl md:text-6xl font-black tracking-tighter leading-none">{donor.blood_type}</span>
              <span className="text-[8px] md:text-xs font-black uppercase tracking-widest opacity-80 mt-1">Group</span>
            </div>
            {donor.verified && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1.5 md:p-2.5 rounded-xl shadow-lg border-4 border-white">
                <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 fill-current" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4 md:space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-on-surface tracking-tight">
                  {donor.full_name}
                </h1>
                <DonorBadge totalDonations={donor.total_donations} className="md:px-4 md:py-2 md:text-xs" />
                {donor.verified && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t('donor.profile.verified')}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-on-surface-variant font-bold text-sm md:text-lg opacity-70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span>{donor.thana}, {donor.district}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <span>{t('donor.profile.member_since')} {format(new Date(donor.created_at), 'MMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className={cn(
                "px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border shadow-sm",
                donor.availability === 'Available' ? 'bg-green-50 text-green-700 border-green-100' :
                donor.availability === 'Emergency Only' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                'bg-slate-50 text-slate-500 border-slate-100'
              )}>
                {donor.availability}
              </span>
              {donor.last_donation_date && (
                <span className="px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-surface-container-low text-on-surface-variant border border-surface-container-medium text-[10px] md:text-xs font-black uppercase tracking-widest">
                  {t('donor.profile.last_donated_label')} {format(new Date(donor.last_donation_date), 'MMM d, yy')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 w-full md:w-auto">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-surface-container-low rounded-2xl border border-surface-container-high">
              <Phone className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <span className="text-xl md:text-2xl font-black text-on-surface tracking-tight">{donor.phone}</span>
            </div>
            <a 
              href={`tel:${donor.phone}`}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-base"
            >
              <Phone className="w-5 h-5" />
              {t('donor.profile.call_now')}
            </a>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Stats & About */}
        <div className="md:col-span-2 space-y-6 md:space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { 
                label: t('donor.profile.total_donations'), 
                value: donor.total_donations > 0 ? donor.total_donations : t('donor.profile.first_time'), 
                icon: Droplets, 
                color: 'text-primary', 
                bg: 'bg-red-50' 
              },
              { 
                label: t('donor.profile.age'), 
                value: donor.date_of_birth ? `${calculateAge(donor.date_of_birth)}` : 'N/A', 
                icon: User, 
                color: 'text-secondary', 
                bg: 'bg-green-50' 
              },
              { 
                label: t('donor.profile.health_bmi'), 
                value: bmi ? bmi : t('donor.profile.healthy'), 
                icon: Activity, 
                color: 'text-blue-600', 
                bg: 'bg-blue-50' 
              },
              { 
                label: t('donor.profile.last_donated'), 
                value: donor.last_donation_date ? format(new Date(donor.last_donation_date), 'MMM yy') : t('donor.profile.ready'), 
                icon: Calendar, 
                color: 'text-orange-600', 
                bg: 'bg-orange-50' 
              },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 rounded-3xl border border-surface-container-low shadow-sm flex flex-col items-center text-center gap-3"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black text-on-surface truncate leading-none mb-1">{stat.value}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* About Section */}
          <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-surface-container-low shadow-sm space-y-6">
            <h3 className="text-xl md:text-3xl font-black text-on-surface flex items-center gap-3">
              <User className="w-5 h-5 md:w-8 md:h-8 text-primary" />
              {t('donor.profile.title')}
            </h3>
            <div className="text-sm md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-80">
              <p className="mb-4">
                {donor.full_name} {t('donor.profile.about_text1')} {donor.thana}, {donor.district}{t('donor.profile.about_text2')} 
                {donor.organ_donor && t('donor.profile.organ_donor_text')}
              </p>
              <p>
                {t('donor.profile.impact_text1')}{donor.full_name.split(' ')[0]}{t('donor.profile.impact_text2')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 md:p-6 bg-surface-container-low rounded-2xl border border-surface-container-medium/30">
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 opacity-60">{t('donor.profile.blood_group')}</div>
                <div className="text-xl md:text-3xl font-black text-primary">{donor.blood_type}</div>
              </div>
              <div className="p-4 md:p-6 bg-surface-container-low rounded-2xl border border-surface-container-medium/30">
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 opacity-60">{t('donor.profile.gender')}</div>
                <div className="text-xl md:text-3xl font-black text-on-surface">{donor.gender || 'N/A'}</div>
              </div>
              <div className="p-4 md:p-6 bg-surface-container-low rounded-2xl border border-surface-container-medium/30">
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 opacity-60">{t('donor.profile.organ_donor')}</div>
                <div className="text-xl md:text-3xl font-black text-on-surface">{donor.organ_donor ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>

          {/* Donation Impact */}
          <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-surface-container-low shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-2xl" />
            <h3 className="text-xl md:text-3xl font-black text-on-surface mb-8 flex items-center gap-3">
              <Heart className="w-5 h-5 md:w-8 md:h-8 text-primary" />
              {t('donor.profile.impact_title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="text-5xl md:text-7xl font-black text-primary tracking-tighter">
                  {donor.total_donations > 0 ? donor.total_donations * 3 : 0}
                </div>
                <div className="text-base md:text-2xl font-bold text-on-surface leading-tight">
                  {t('donor.profile.lives_saved')}
                </div>
                <p className="text-xs md:text-base text-on-surface-variant font-medium opacity-70">
                  {t('donor.profile.impact_desc')}{donor.full_name.split(' ')[0]}{t('donor.profile.impact_desc2')}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-6 md:p-10 flex items-center justify-center border border-surface-container-medium/30">
                <div className="text-center space-y-3">
                  <Droplets className="w-10 h-10 md:w-16 md:h-16 text-primary mx-auto animate-pulse" />
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">{t('donor.profile.hero_donor')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Availability & Sidebar */}
        <div className="space-y-6 md:space-y-8">
          {/* Availability Control (If Own Profile) */}
          {isOwnProfile && (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-surface-container-low shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t('donor.profile.update_availability')}
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('donor.profile.edit_profile')}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(['Available', 'Not Available', 'Emergency Only'] as Donor['availability'][]).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateAvailability(status)}
                    disabled={isUpdating}
                    className={cn(
                      "w-full px-5 py-3 rounded-xl text-xs font-black transition-all active:scale-95 text-left flex items-center justify-between",
                      donor.availability === status
                        ? "bg-primary text-white shadow-md"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-medium"
                    )}
                  >
                    {status === 'Available' ? t('donors.list.available') : 
                     status === 'Not Available' ? t('donors.list.not_available') : 
                     t('donors.list.emergency_only')}
                    {donor.availability === status && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Donation Readiness */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-surface-container-low shadow-sm space-y-6">
            <h3 className="text-lg md:text-xl font-black text-on-surface flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              {t('donor.profile.readiness_title')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {(() => {
                  if (!donor.last_donation_date) return (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    </div>
                  );
                  const lastDate = new Date(donor.last_donation_date);
                  const nextEligibleDate = new Date(lastDate);
                  nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
                  const isEligible = new Date() >= nextEligibleDate;
                  
                  return isEligible ? (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-1">
                <div className="text-sm md:text-lg font-black text-on-surface">
                  {(() => {
                    if (!donor.last_donation_date) return t('donor.profile.ready_to_donate');
                    const lastDate = new Date(donor.last_donation_date);
                    const nextEligibleDate = new Date(lastDate);
                    nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
                    return new Date() >= nextEligibleDate ? t('donor.profile.ready_to_donate') : t('donor.profile.recovery_period');
                  })()}
                </div>
                <p className="text-[10px] md:text-xs text-on-surface-variant font-medium opacity-70 leading-tight">
                  {(() => {
                    if (!donor.last_donation_date) return t('donor.profile.ready_desc');
                    const lastDate = new Date(donor.last_donation_date);
                    const nextEligibleDate = new Date(lastDate);
                    nextEligibleDate.setMonth(nextEligibleDate.getMonth() + 3);
                    return new Date() >= nextEligibleDate 
                      ? t('donor.profile.eligible_desc')
                      : `${t('donor.profile.recovery_desc')}${format(nextEligibleDate, 'MMM d, yyyy')}.`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Summary */}
          {(donor.weight_kg || donor.medical_conditions) && (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-surface-container-low shadow-sm space-y-6">
              <h3 className="text-lg md:text-xl font-black text-on-surface flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('donor.profile.medical_title')}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {donor.weight_kg && (
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <div className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-0.5">{t('donor.profile.weight')}</div>
                      <div className="text-sm font-bold text-on-surface">{donor.weight_kg} kg</div>
                    </div>
                  )}
                  {donor.height_cm && (
                    <div className="p-3 bg-surface-container-low rounded-xl">
                      <div className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-0.5">{t('donor.profile.height')}</div>
                      <div className="text-sm font-bold text-on-surface">{formatHeight(donor.height_cm)}</div>
                    </div>
                  )}
                </div>
                {donor.medical_conditions && (
                  <div className="space-y-1">
                    <div className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{t('donor.profile.medical_conditions')}</div>
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                      {donor.medical_conditions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Safety Guidelines */}
          <div className="bg-surface-container-low p-6 md:p-8 rounded-[2rem] border border-surface-container-medium/30 space-y-6">
            <h4 className="text-sm md:text-lg font-black text-on-surface flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
              {t('donor.profile.safety_title')}
            </h4>
            <ul className="space-y-3">
              {[
                t('donor.profile.safety_rule1'),
                t('donor.profile.safety_rule2'),
                t('donor.profile.safety_rule3'),
                t('donor.profile.safety_rule4')
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[10px] md:text-xs text-on-surface-variant font-medium opacity-80">
                  <div className="w-1 h-1 rounded-full bg-secondary mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-tight opacity-40 text-center pt-2">
              {t('donor.profile.privacy_notice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;
