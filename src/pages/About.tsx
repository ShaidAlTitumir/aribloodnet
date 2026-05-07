import React, { useEffect, useState } from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Users, 
  Droplets, 
  Activity, 
  Globe,
  CheckCircle2,
  HelpCircle,
  Mail,
  ExternalLink,
  Facebook,
  Hospital
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { fetchAppStats, AppStats } from '@/src/lib/statsService';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '@/src/lib/supabase';

const About = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    const getStats = async () => {
      if (!isSupabaseConfigured()) {
        const data = await fetchAppStats();
        setStats(data);
        return;
      }
      
      try {
        const data = await fetchAppStats();
        setStats(data);
      } catch (err) {
        console.error('About page stats error:', err);
      }
    };
    getStats();
  }, []);

  const formatStatValue = (value: number) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    }
    return value.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 md:pb-24 space-y-16 md:space-y-32">
      {/* Hero Section */}
      <div className="pt-12 md:pt-24 text-center space-y-6 md:space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-red-50 text-primary rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-red-100 shadow-sm"
        >
          <Heart className="w-3 h-3 md:w-4 md:h-4 fill-current" />
          {t('about.badge')}
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-[9rem] font-black text-on-surface tracking-tighter leading-[0.85] md:leading-[0.8]"
        >
          {t('about.hero.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto text-base md:text-3xl text-on-surface-variant font-medium leading-relaxed opacity-70"
        >
          {t('about.hero.subtitle')}
        </motion.p>
      </div>

      {/* Mission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] shadow-2xl shadow-black/5 border border-surface-container-low relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 editorial-gradient opacity-[0.03] rounded-full -mr-32 -mt-32 blur-3xl" />
          <h2 className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter mb-8 md:mb-12">{t('about.mission.title')}</h2>
          <p className="text-base md:text-3xl text-on-surface-variant font-medium leading-relaxed opacity-80">
            {t('about.mission.text')}
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 md:gap-8">
          {[
            { label: t('stats.active_donors'), value: stats ? formatStatValue(stats.activeDonors) : '...', icon: Users, color: 'text-primary', bg: 'bg-red-50' },
            { label: t('stats.lives_saved'), value: stats ? formatStatValue(stats.livesSaved) : '...', icon: Heart, color: 'text-secondary', bg: 'bg-green-50' },
            { label: t('stats.success_rate'), value: stats ? `${stats.successRate}%` : '...', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: t('stats.hospitals'), value: stats ? formatStatValue(stats.hospitals) : '...', icon: Hospital, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-surface-container-low shadow-sm text-center space-y-4"
            >
              <div className={`w-12 h-12 md:w-20 md:h-20 ${stat.bg} rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto shadow-inner`}>
                <stat.icon className={`w-6 h-6 md:w-10 md:h-10 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl md:text-5xl font-black text-on-surface tracking-tighter">{stat.value}</div>
                <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why Donate Section */}
      <div className="space-y-12 md:space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-7xl font-black text-on-surface tracking-tighter">{t('about.why.title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {[
            {
              title: t('about.why.save_lives.title'),
              text: t('about.why.save_lives.text'),
              icon: Droplets,
              color: 'bg-red-500'
            },
            {
              title: t('about.why.health.title'),
              text: t('about.why.health.text'),
              icon: Activity,
              color: 'bg-green-500'
            },
            {
              title: t('about.why.community.title'),
              text: t('about.why.community.text'),
              icon: Users,
              color: 'bg-blue-500'
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-surface-container-low shadow-sm hover:shadow-xl transition-all group"
            >
              <div className={`w-14 h-14 md:w-24 md:h-24 ${item.color} rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mb-8 md:mb-12 shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon className="w-7 h-7 md:w-12 md:h-12 text-white" />
              </div>
              <h3 className="text-xl md:text-4xl font-black text-on-surface mb-4 md:mb-6">{item.title}</h3>
              <p className="text-sm md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-70">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-surface-container-low rounded-[3rem] md:rounded-[6rem] p-8 md:p-24 border border-surface-container-medium/50">
        <div className="max-w-4xl mx-auto space-y-12 md:space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-7xl font-black text-on-surface tracking-tighter flex items-center justify-center gap-4 md:gap-8">
              <HelpCircle className="w-8 h-8 md:w-16 md:h-16 text-primary" />
              {t('about.faq.title')}
            </h2>
          </div>
          <div className="space-y-4 md:space-y-8">
            {[
              { q: t('about.faq.q1'), a: t('about.faq.a1') },
              { q: t('about.faq.q2'), a: t('about.faq.a2') },
              { q: t('about.faq.q3'), a: t('about.faq.a3') }
            ].map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[3rem] border border-surface-container-medium/30 shadow-sm"
              >
                <h4 className="text-lg md:text-3xl font-black text-on-surface mb-4 flex items-start gap-4">
                  <span className="text-primary">Q.</span>
                  {faq.q}
                </h4>
                <p className="text-sm md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-70 pl-10">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Developer Section */}
      <div className="text-center space-y-12 md:space-y-20">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter">{t('about.dev.title')}</h2>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-white p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] border border-surface-container-low shadow-2xl shadow-black/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          <div className="space-y-8 md:space-y-12">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-surface-container-low rounded-[2rem] md:rounded-[3rem] flex items-center justify-center mx-auto border border-surface-container-medium">
              <Activity className="w-10 h-10 md:w-16 md:h-16 text-primary" />
            </div>
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-2xl md:text-5xl font-black text-on-surface tracking-tighter">{t('about.dev.company')}</h3>
              <div className="text-base md:text-2xl text-on-surface-variant font-medium leading-relaxed opacity-70 space-y-4 whitespace-pre-wrap text-justify">
                {t('about.dev.description')}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-6 md:pt-10">
              <a href="#" className="flex items-center gap-2 px-6 py-3 md:px-10 md:py-5 bg-surface-container-low text-on-surface rounded-full text-xs md:text-lg font-black hover:bg-surface-container-medium transition-all">
                <Globe className="w-4 h-4 md:w-6 md:h-6" /> Website
              </a>
              <a 
                href="https://www.facebook.com/alribatintl" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-6 py-3 md:px-10 md:py-5 bg-surface-container-low text-on-surface rounded-full text-xs md:text-lg font-black hover:bg-surface-container-medium transition-all"
              >
                <Facebook className="w-4 h-4 md:w-6 md:h-6 text-[#1877F2]" /> {t('about.dev.facebook')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="editorial-gradient p-10 md:p-32 rounded-[3rem] md:rounded-[6rem] text-white text-center space-y-10 md:space-y-16 relative overflow-hidden shadow-2xl shadow-red-200"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
        <div className="relative z-10 space-y-6 md:space-y-10">
          <h2 className="text-4xl md:text-[7rem] font-black tracking-tighter leading-none">{t('about.cta.title')}</h2>
          <p className="max-w-2xl mx-auto text-base md:text-3xl font-medium opacity-90 leading-relaxed">
            {t('about.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 pt-6 md:pt-10">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-5 md:px-16 md:py-10 bg-white text-primary rounded-2xl md:rounded-[3rem] text-base md:text-3xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <CheckCircle2 className="w-6 h-6 md:w-10 md:h-10" />
              {t('about.cta.register')}
            </button>
            <a 
              href="https://www.facebook.com/S.A.Titumir"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-5 md:px-16 md:py-10 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl md:rounded-[3rem] text-base md:text-3xl font-black hover:bg-white/20 transition-all flex items-center justify-center gap-4"
            >
              <Facebook className="w-6 h-6 md:w-10 md:h-10" />
              {t('about.cta.support')}
            </a>
          </div>
        </div>
      </motion.div>

      {/* Footer Credit */}
      <div className="text-center pb-12 opacity-40">
        <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-on-surface-variant">
          Developed by Al-Ribat International
        </p>
      </div>
    </div>
  );
};

export default About;
