import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Droplets, 
  Activity, 
  ShieldCheck, 
  LogOut,
  Save,
  AlertCircle,
  CheckCircle2,
  Heart,
  Calendar,
  Weight,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { DISTRICTS, BLOOD_TYPES, THANAS_BY_DISTRICT, geocodeLocation, cn } from '@/src/lib/utils';
import { Profile, Donor } from '@/src/types';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useErrorStore } from '@/src/lib/errorTracking';

import { DonorBadge } from '@/src/components/DonorBadge';

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setFetchError } = useErrorStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [donor, setDonor] = useState<Partial<Donor> | null>(null);

  const cmToFtIn = (cm: number | null) => {
    if (!cm) return { ft: '', in: '' };
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return { ft: ft.toString(), in: inch.toString() };
  };

  const ftInToCm = (ft: string, inch: string) => {
    const f = parseInt(ft) || 0;
    const i = parseInt(inch) || 0;
    if (f === 0 && i === 0) return null;
    return Math.round((f * 12 + i) * 2.54);
  };

  const bmi = donor?.weight_kg && donor?.height_cm 
    ? (donor.weight_kg / Math.pow(donor.height_cm / 100, 2)).toFixed(1) 
    : null;
  
  const bmiValue = bmi ? parseFloat(bmi) : null;
  const bmiCategory = bmiValue ? (
    bmiValue < 18.5 ? { label: t('profile.bmi.underweight'), color: 'text-blue-600', bg: 'bg-blue-50' } :
    bmiValue < 25 ? { label: t('profile.bmi.normal'), color: 'text-green-600', bg: 'bg-green-50' } :
    bmiValue < 30 ? { label: t('profile.bmi.overweight'), color: 'text-orange-600', bg: 'bg-orange-50' } :
    { label: t('profile.bmi.obese'), color: 'text-red-600', bg: 'bg-red-50' }
  ) : null;
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile using maybeSingle to avoid error if not found
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // If profile doesn't exist, try to create it using upsert
      if (!profileData) {
        const { data: newProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'New User',
            email: user.email || '',
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();
        
        if (upsertError) {
          // If upsert still fails with duplicate key, it means it was created in the meantime
          if (upsertError.message.includes('duplicate key')) {
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (retryError) throw retryError;
            profileData = retryData;
          } else {
            throw upsertError;
          }
        } else {
          profileData = newProfile;
        }
      }

      if (!profileData) {
        throw new Error('Profile could not be loaded. Please try refreshing the page.');
      }

      const { ft, in: inch } = cmToFtIn(profileData.height_cm);
      setProfile({ ...profileData, height_ft: ft, height_in: inch });

      // Fetch donor info if it exists (regardless of is_donor status)
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (donorError) throw donorError;
      if (donorData) {
        const { ft: dFt, in: dInch } = cmToFtIn(donorData.height_cm);
        setDonor({ ...donorData, height_ft: dFt, height_in: dInch });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      let message = err.message || 'An error occurred while loading your profile.';
      if (message === 'Failed to fetch') {
        setFetchError(true);
        message = 'Could not connect to the database. Please check your internet connection or Supabase configuration.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.full_name,
      profile.phone,
      profile.district,
      profile.thana,
      profile.blood_type,
      profile.gender,
      profile.date_of_birth,
      profile.weight_kg,
      profile.height_cm
    ];
    const completed = fields.filter(f => f !== null && f !== undefined && f !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
    
    if (name === 'district') {
      setProfile(prev => prev ? { ...prev, thana: '' } : null);
    }
  };

  const handleProfileHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, [name]: value };
      const cm = ftInToCm(
        name === 'height_ft' ? value : (updated.height_ft || '0'),
        name === 'height_in' ? value : (updated.height_in || '0')
      );
      return { ...updated, height_cm: cm };
    });
  };

  const handleDonorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setDonor(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }

    // If turning on donor status, availability is mandatory
    if (profile?.is_donor && !donor?.availability) {
      setError('Availability is mandatory when turning on donor status.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Geocode location if district and thana are present
      let latitude = donor?.latitude || null;
      let longitude = donor?.longitude || null;

      if (profile?.district && profile?.thana) {
        const coords = await geocodeLocation(profile.thana, profile.district);
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lon;
        }
      }

      // Update profile
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile?.full_name,
          phone: profile?.phone,
          district: profile?.district,
          thana: profile?.thana,
          blood_type: profile?.blood_type,
          gender: profile?.gender,
          date_of_birth: profile?.date_of_birth,
          weight_kg: profile?.weight_kg ? parseInt(profile.weight_kg.toString()) : null,
          height_cm: profile?.height_cm || null,
          last_donation_date: profile?.last_donation_date || null,
          total_donations: profile?.total_donations ? parseInt(profile.total_donations.toString()) : 0,
          is_donor: profile?.is_donor
        })
        .eq('id', user?.id);

      if (profileUpdateError) throw profileUpdateError;

      // Update donor specific info (publicly searchable)
      if (profile?.is_donor) {
        const { error: donorUpsertError } = await supabase
          .from('donors')
          .upsert({
            user_id: user?.id,
            full_name: profile?.full_name,
            email: profile?.email,
            phone: profile?.phone,
            district: profile?.district,
            thana: profile?.thana,
            blood_type: profile?.blood_type,
            weight_kg: profile?.weight_kg ? parseInt(profile.weight_kg.toString()) : null,
            height_cm: profile?.height_cm || null,
            total_donations: profile?.total_donations ? parseInt(profile.total_donations.toString()) : 0,
            last_donation_date: profile?.last_donation_date || null,
            date_of_birth: profile?.date_of_birth || null,
            gender: profile?.gender || 'Male',
            organ_donor: donor?.organ_donor || false,
            availability: donor?.availability || 'Available',
            latitude,
            longitude
          }, { onConflict: 'user_id' });
        
        if (donorUpsertError) throw donorUpsertError;
      }

      setSuccess(t('profile.success'));
      fetchProfile();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      let message = err.message || 'An error occurred while saving your profile.';
      if (message === 'Failed to fetch') {
        message = 'Could not connect to the database. Please check your internet connection or Supabase configuration.';
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    navigate('/auth');
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const availableThanas = profile?.district ? THANAS_BY_DISTRICT[profile.district] || [] : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-20 md:h-20 editorial-gradient rounded-2xl md:rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-red-200 shrink-0">
            <User className="w-6 h-6 md:w-10 md:h-10" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-5xl font-black text-on-surface tracking-tighter leading-none mb-1">{t('profile.title')}</h1>
              {profile?.total_donations && <DonorBadge totalDonations={profile.total_donations} className="md:px-4 md:py-2 md:text-xs" />}
            </div>
            <p className="text-[10px] md:text-xs text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-60">{t('profile.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-48 space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              <span>{t('profile.completion')}</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-surface-container-low rounded-full overflow-hidden border border-surface-container-high">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  completionPercentage === 100 ? "bg-green-500" : "bg-primary"
                )}
              />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-surface-container-low text-on-surface-variant rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-surface-container-medium transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('profile.sign_out')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 md:space-y-8">
        {error && (
          <div className="p-4 md:p-6 bg-red-50 border border-red-100 rounded-2xl md:rounded-3xl flex items-center gap-3 text-red-600 text-xs md:text-base font-bold shadow-sm">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 md:p-6 bg-green-50 border border-green-100 rounded-2xl md:rounded-3xl flex items-center gap-3 text-green-600 text-xs md:text-base font-bold shadow-sm">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-surface-container-low shadow-xl shadow-black/5">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600">
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className="text-lg md:text-2xl font-black text-on-surface tracking-tight">
              {t('profile.basic_info')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.full_name')}</label>
              <input 
                required
                name="full_name"
                value={profile?.full_name || ''}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.email')}</label>
              <input 
                disabled
                value={profile?.email || ''}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-lowest text-on-surface-variant/40 cursor-not-allowed border-surface-container-low border rounded-xl md:rounded-2xl text-sm md:text-base font-bold"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.phone')}</label>
              <input 
                name="phone"
                value={profile?.phone || ''}
                onChange={handleProfileChange}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.district')}</label>
                <div className="relative">
                  <select 
                    name="district"
                    value={profile?.district || ''}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none pr-10"
                  >
                    <option value="">{t('donors.filter.all_districts')}</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.thana')}</label>
                <div className="relative">
                  <select 
                    name="thana"
                    value={profile?.thana || ''}
                    onChange={handleProfileChange}
                    disabled={!profile?.district}
                    className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">{t('donors.filter.all_thanas')}</option>
                    {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>

            {/* Donor Info in Basic Info */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.blood_type')}</label>
              <div className="relative">
                <select 
                  name="blood_type"
                  value={profile?.blood_type || ''}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none pr-10"
                >
                  <option value="">{t('register.blood_type_placeholder')}</option>
                  {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.gender')}</label>
              <div className="relative">
                <select 
                  name="gender"
                  value={profile?.gender || ''}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none pr-10"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">{t('register.gender.male')}</option>
                  <option value="Female">{t('register.gender.female')}</option>
                  <option value="Other">{t('register.gender.other')}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.dob')}</label>
              <input 
                type="date"
                name="date_of_birth"
                value={profile?.date_of_birth || ''}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.weight')}</label>
              <input 
                type="number"
                name="weight_kg"
                value={profile?.weight_kg || ''}
                onChange={handleProfileChange}
                placeholder={t('register.weight_placeholder')}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.height')}</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input 
                    type="number"
                    name="height_ft"
                    value={profile?.height_ft || ''}
                    onChange={handleProfileHeightChange}
                    placeholder="ft"
                    className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-on-surface-variant opacity-40">FT</span>
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    name="height_in"
                    value={profile?.height_in || ''}
                    onChange={handleProfileHeightChange}
                    placeholder="in"
                    className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-on-surface-variant opacity-40">IN</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.last_donation')}</label>
              <input 
                type="date"
                name="last_donation_date"
                value={profile?.last_donation_date || ''}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.total_donations')}</label>
              <input 
                type="number"
                name="total_donations"
                value={profile?.total_donations || '0'}
                onChange={handleProfileChange}
                placeholder={t('register.total_donations_placeholder')}
                className="w-full px-4 py-3 md:px-5 md:py-4 bg-surface-container-low border border-surface-container-high rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Donor Status Toggle */}
        <div className={cn(
          "p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border transition-all shadow-xl shadow-black/5",
          profile?.is_donor 
          ? "bg-red-50/50 border-red-100" 
          : "bg-white border-surface-container-low"
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className={cn(
                "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-lg",
                profile?.is_donor ? "bg-primary text-white shadow-red-200" : "bg-surface-container-low text-on-surface-variant"
              )}>
                <Droplets className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-black text-on-surface leading-none mb-1">{t('profile.donor_status')}</h3>
                <p className="text-[10px] md:text-sm font-medium text-on-surface-variant truncate opacity-60 uppercase tracking-widest">
                  {profile?.is_donor ? t('profile.donor_status_active') : t('profile.donor_status_inactive')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProfile(prev => prev ? { ...prev, is_donor: !prev.is_donor } : null)}
              className={cn(
                "relative w-12 h-7 md:w-16 md:h-9 rounded-full transition-all shrink-0 shadow-inner",
                profile?.is_donor ? "bg-primary" : "bg-surface-container-high"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 md:w-7 md:h-7 bg-white rounded-full transition-all shadow-md",
                profile?.is_donor ? "left-6 md:left-8" : "left-1"
              )} />
            </button>
          </div>

          {profile?.is_donor && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 md:mt-10 pt-6 md:pt-10 border-t border-red-100/50 space-y-6 md:space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('profile.availability')} <span className="text-primary">*</span></label>
                  <div className="relative">
                    <select 
                      required
                      name="availability"
                      value={donor?.availability || ''}
                      onChange={handleDonorChange}
                      className="w-full px-4 py-3 md:px-5 md:py-4 bg-white border border-red-100 rounded-xl md:rounded-2xl text-sm md:text-base font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none appearance-none pr-10 shadow-sm"
                    >
                      <option value="">Select Availability</option>
                      <option value="Available">{t('profile.availability.available')}</option>
                      <option value="Not Available">{t('profile.availability.not_available')}</option>
                      <option value="Emergency Only">{t('profile.availability.emergency_only')}</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 md:p-6 bg-white rounded-xl md:rounded-2xl border border-red-100 shadow-sm">
                <input 
                  type="checkbox"
                  id="organ_donor"
                  name="organ_donor"
                  checked={donor?.organ_donor || false}
                  onChange={handleDonorChange}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-lg accent-primary cursor-pointer"
                />
                <label htmlFor="organ_donor" className="font-black text-xs md:text-lg text-on-surface cursor-pointer leading-tight">
                  {t('profile.organ_donor_interest')}
                </label>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-10 py-4 md:px-16 md:py-6 bg-primary text-white rounded-xl md:rounded-[2rem] font-black shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm md:text-xl flex items-center justify-center gap-3"
          >
            {saving ? t('profile.saving') : t('profile.save')}
            {!saving && <Save className="w-4 h-4 md:w-6 md:h-6" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
