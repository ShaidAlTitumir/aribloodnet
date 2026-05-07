import React, { useState, useEffect } from 'react';
import { 
  User, 
  Droplets, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Weight, 
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { DISTRICTS, BLOOD_TYPES, THANAS_BY_DISTRICT, geocodeLocation } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useErrorStore } from '@/src/lib/errorTracking';

const Register = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { setFetchError } = useErrorStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    full_name: '',
    blood_type: '',
    date_of_birth: '',
    gender: 'Male',
    district: '',
    thana: '',
    phone: '',
    email: '',
    weight_kg: '',
    last_donation_date: '',
    total_donations: '0',
    medical_conditions: '',
    organ_donor: false,
    availability: 'Available'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || prev.full_name,
        email: user.email || prev.email
      }));
      
      // Check if already a donor
      checkDonorStatus();
    }
  }, [user, authLoading]);

  const checkDonorStatus = async () => {
    if (!user || !isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('donors')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      // Already a donor, redirect to profile
      navigate('/profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Reset thana if district changes
    if (name === 'district') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        thana: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const availableThanas = formData.district ? THANAS_BY_DISTRICT[formData.district] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }
    if (!user) {
      setError('Please sign in to register as a donor.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Geocode location
      const coords = await geocodeLocation(formData.thana, formData.district);

      const { data: donorData, error: submitError } = await supabase
        .from('donors')
        .insert([{
          ...formData,
          user_id: user.id,
          weight_kg: parseInt(formData.weight_kg) || null,
          total_donations: parseInt(formData.total_donations) || 0,
          date_of_birth: formData.date_of_birth || null,
          last_donation_date: formData.last_donation_date || null,
          latitude: coords?.lat || null,
          longitude: coords?.lon || null
        }])
        .select('id')
        .single();

      if (submitError) throw submitError;

      // Update profile to is_donor = true and link donor_id
      if (donorData) {
        await supabase
          .from('profiles')
          .update({ 
            is_donor: true,
            donor_id: donorData.id
          })
          .eq('id', user.id);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
      }
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-surface-container-low"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-on-surface tracking-tighter mb-2">{t('register.success.title')}</h2>
          <p className="text-xs text-on-surface-variant font-medium mb-8">
            {t('register.success.subtitle')}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn-compact w-full bg-primary text-white"
          >
            {t('register.go_home')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
      <div className="mb-16 md:mb-24 text-center space-y-4 md:space-y-6">
        <h1 className="text-5xl md:text-[8rem] font-black text-on-surface tracking-tighter leading-[0.8] md:leading-[0.75]">{t('register.title')}</h1>
        <p className="text-base md:text-3xl text-on-surface-variant font-medium leading-relaxed opacity-70">{t('register.subtitle')}</p>
      </div>

      <div className="bg-white rounded-[3rem] md:rounded-[5rem] shadow-2xl shadow-black/5 overflow-hidden border border-surface-container-low">
        {/* Progress Bar */}
        <div className="h-3 bg-surface-container-low w-full">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '33%' }}
            animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-10 md:p-24">
          {error && (
            <div className="mb-12 p-6 md:p-8 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600 text-xs md:text-lg font-bold">
              <AlertCircle className="w-6 h-6 md:w-10 md:h-10 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10 md:space-y-16"
            >
              <h2 className="text-2xl md:text-5xl font-black text-on-surface mb-10 flex items-center gap-4 md:gap-6">
                <User className="text-primary w-8 h-8 md:w-14 md:h-14" /> {t('register.step1.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.full_name')}</label>
                  <input 
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t('register.full_name_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.blood_type')}</label>
                  <div className="relative">
                    <select 
                      required
                      name="blood_type"
                      value={formData.blood_type}
                      onChange={handleChange}
                      className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                    >
                      <option value="">{t('register.blood_type_placeholder')}</option>
                      {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-6 h-6 md:w-10 md:h-10 text-on-surface-variant opacity-40" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.dob')}</label>
                  <input 
                    required
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.gender')}</label>
                  <div className="relative">
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                    >
                      <option value="Male">{t('register.gender.male')}</option>
                      <option value="Female">{t('register.gender.female')}</option>
                      <option value="Other">{t('register.gender.other')}</option>
                    </select>
                    <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-6 h-6 md:w-10 md:h-10 text-on-surface-variant opacity-40" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 md:pt-20">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-6 md:py-10 bg-primary text-white rounded-2xl md:rounded-[3rem] font-black shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-base md:text-3xl flex items-center justify-center gap-4"
                >
                  {t('register.next')} <ArrowRight className="w-6 h-6 md:w-10 md:h-10" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10 md:space-y-16"
            >
              <h2 className="text-2xl md:text-5xl font-black text-on-surface mb-10 flex items-center gap-4 md:gap-6">
                <MapPin className="text-primary w-8 h-8 md:w-14 md:h-14" /> {t('register.step2.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.district')}</label>
                  <div className="relative">
                    <select 
                      required
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none"
                    >
                      <option value="">{t('register.district_placeholder')}</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-6 h-6 md:w-10 md:h-10 text-on-surface-variant opacity-40" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.thana')}</label>
                  <div className="relative">
                    <select 
                      required
                      name="thana"
                      value={formData.thana}
                      onChange={handleChange}
                      disabled={!formData.district}
                      className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none disabled:opacity-50"
                    >
                      <option value="">{formData.district ? t('register.thana_placeholder') : t('register.thana_placeholder_district')}</option>
                      {availableThanas.map(t => <option key={t} value={t}>{t}</option>)}
                      {formData.district && availableThanas.length === 0 && (
                        <option value="Other">Other / Not Listed</option>
                      )}
                    </select>
                    <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-6 h-6 md:w-10 md:h-10 text-on-surface-variant opacity-40" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.phone')}</label>
                  <input 
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('register.phone_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.email')}</label>
                  <input 
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('register.email_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-12 md:pt-20 flex flex-col md:flex-row gap-6">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-6 md:py-10 bg-surface-container-low text-on-surface rounded-2xl md:rounded-[3rem] font-black hover:bg-surface-container-medium transition-all text-base md:text-2xl"
                >
                  {t('register.back')}
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full py-6 md:py-10 bg-primary text-white rounded-2xl md:rounded-[3rem] font-black shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-base md:text-3xl flex items-center justify-center gap-4"
                >
                  {t('register.next')} <ArrowRight className="w-6 h-6 md:w-10 md:h-10" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10 md:space-y-16"
            >
              <h2 className="text-2xl md:text-5xl font-black text-on-surface mb-10 flex items-center gap-4 md:gap-6">
                <Activity className="text-primary w-8 h-8 md:w-14 md:h-14" /> {t('register.step3.title')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.weight')}</label>
                  <input 
                    type="number"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    placeholder={t('register.weight_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.last_donation')}</label>
                  <input 
                    type="date"
                    name="last_donation_date"
                    value={formData.last_donation_date}
                    onChange={handleChange}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.total_donations')}</label>
                  <input 
                    type="number"
                    name="total_donations"
                    value={formData.total_donations}
                    onChange={handleChange}
                    placeholder={t('register.total_donations_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('register.medical_conditions')}</label>
                  <textarea 
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    placeholder={t('register.medical_conditions_placeholder')}
                    className="w-full px-6 py-5 md:px-8 md:py-8 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[2rem] text-sm md:text-2xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none h-48 md:h-64 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 p-8 md:p-12 bg-red-50 rounded-[2rem] md:rounded-[3rem] border border-red-100 group cursor-pointer">
                <input 
                  type="checkbox"
                  id="organ_donor"
                  name="organ_donor"
                  checked={formData.organ_donor}
                  onChange={handleChange}
                  className="w-8 h-8 md:w-12 md:h-12 rounded-xl accent-primary cursor-pointer shrink-0"
                />
                <label htmlFor="organ_donor" className="text-base md:text-3xl font-black text-on-surface cursor-pointer leading-tight">
                  {t('register.organ_donor_interest')}
                </label>
              </div>

              <div className="pt-12 md:pt-20 flex flex-col md:flex-row gap-6">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-6 md:py-10 bg-surface-container-low text-on-surface rounded-2xl md:rounded-[3rem] font-black hover:bg-surface-container-medium transition-all text-base md:text-2xl"
                >
                  {t('register.back')}
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 md:py-10 bg-primary text-white rounded-2xl md:rounded-[3rem] font-black shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-base md:text-3xl flex items-center justify-center gap-4"
                >
                  {loading ? t('register.processing') : t('register.complete')}
                  {!loading && <ShieldCheck className="w-6 h-6 md:w-10 md:h-10" />}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
