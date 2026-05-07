import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Droplets
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';

import { useLanguage } from '@/src/contexts/LanguageContext';
import { useErrorStore } from '@/src/lib/errorTracking';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setFetchError } = useErrorStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (error.message !== 'Auth session missing!') {
            console.error('Auth session error:', error);
          }
          if (error.message.includes('Refresh Token Not Found')) {
            supabase.auth.signOut();
          }
          return;
        }
        if (session) navigate('/profile');
      })
      .catch(err => {
        console.error('Auth session catch error:', err);
      });
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please check your environment variables.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (loginError) throw loginError;
      } else {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            }
          }
        });
        if (signUpError) throw signUpError;
        
        // Create profile if signup successful (using upsert to avoid race conditions with trigger)
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([{
              id: data.user.id,
              full_name: formData.full_name,
              email: formData.email,
            }]);
          // We don't throw profileError here because the user is still signed up
          if (profileError) console.error('Profile creation error:', profileError);
        }
        
        setShowSuccess(true);
        return;
      }
      navigate('/profile');
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err.message || 'An error occurred during authentication.';
      if (message === 'Failed to fetch') {
        setFetchError(true);
        message = 'Could not connect to the authentication server. Please check your internet connection or Supabase configuration.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 md:py-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <div className="w-16 h-16 md:w-24 md:h-24 editorial-gradient rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-200 mx-auto mb-6">
            <Droplets className="text-white w-8 h-8 md:w-12 md:h-12" />
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter leading-none">
            {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
          </h1>
          <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70">
            {isLogin ? t('auth.signin_subtitle') : t('auth.signup_subtitle')}
          </p>
        </div>

        <div className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl shadow-black/5 border border-surface-container-low">
          {showSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-20 h-20 md:w-32 md:h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 md:w-16 md:h-16 text-green-600" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter">{t('auth.check_email')}</h2>
                <p className="text-sm md:text-xl text-on-surface-variant font-medium opacity-70 leading-relaxed">
                  {t('auth.confirmation_sent')} <span className="text-primary font-bold">{formData.email}</span>. 
                  {t('auth.complete_registration')}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSuccess(false);
                  setIsLogin(true);
                  setFormData({ email: '', password: '', full_name: '' });
                }}
                className="w-full py-5 md:py-8 bg-primary text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-2xl shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {t('auth.back_to_login')} <ArrowRight className="w-5 h-5 md:w-7 md:h-7" />
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6 md:space-y-8">
            {error && (
              <div className="p-4 md:p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs md:text-sm font-bold">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('auth.full_name')}</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                  <input 
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t('auth.full_name_placeholder')}
                    className="w-full pl-14 pr-6 py-4 md:py-6 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[1.5rem] text-sm md:text-xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('auth.email')}</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                <input 
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.email_placeholder')}
                  className="w-full pl-14 pr-6 py-4 md:py-6 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[1.5rem] text-sm md:text-xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant ml-2">{t('auth.password')}</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-on-surface-variant/30 group-focus-within:text-primary transition-colors" />
                <input 
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full pl-14 pr-6 py-4 md:py-6 bg-surface-container-low border border-surface-container-high rounded-2xl md:rounded-[1.5rem] text-sm md:text-xl font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 md:py-8 bg-primary text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-2xl shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-8"
            >
              {loading ? t('auth.processing') : isLogin ? t('auth.signin_button') : t('auth.signup_button')}
              {!loading && <ArrowRight className="w-5 h-5 md:w-7 md:h-7" />}
            </button>
          </form>
        )}

        {!showSuccess && (
          <div className="mt-10 pt-10 border-t border-surface-container-low text-center">
            <p className="text-xs md:text-lg text-on-surface-variant font-medium">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-black hover:underline"
              >
                {isLogin ? t('auth.signup_link') : t('auth.signin_link')}
              </button>
            </p>
          </div>
        )}
      </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] md:text-sm font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
          <ShieldCheck className="w-4 h-4 md:w-6 md:h-6 text-secondary" />
          {t('auth.secure_auth')}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
