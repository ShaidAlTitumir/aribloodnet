import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Droplets, 
  Search, 
  PlusCircle, 
  AlertCircle, 
  User, 
  Home, 
  Heart, 
  Menu, 
  X, 
  MapPin,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { supabase } from '@/src/lib/supabase';

import { useErrorStore } from '@/src/lib/errorTracking';
import { isSupabaseConfigured } from '@/src/lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasFetchError } = useErrorStore();

  const navItems = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.donors'), path: '/donors', icon: Search },
    { name: t('nav.emergency'), path: '/emergency', icon: AlertCircle },
    { name: t('nav.groups'), path: '/groups', icon: Building2 },
    { name: t('nav.about'), path: '/about', icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-10 md:h-10 editorial-gradient rounded-lg flex items-center justify-center shadow-lg shadow-red-200 group-active:scale-95 transition-transform">
              <Droplets className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-lg md:text-xl font-black tracking-tighter text-primary">ARI Blood Net</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-xs font-black uppercase tracking-widest transition-colors hover:text-primary",
                  location.pathname === item.path ? "text-primary" : "text-on-surface-variant"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="px-3 py-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant border border-transparent flex items-center justify-center"
              title={language === 'en' ? "Switch to Bengali" : "Switch to English"}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">
                {language === 'en' ? 'BN' : 'EN'}
              </span>
            </button>

            {/* User Profile Link */}
            <Link 
              to={user ? "/profile" : "/auth"}
              className="p-1.5 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant flex items-center border border-transparent"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-container-medium flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </Link>

            <button 
              className="md:hidden p-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-white pt-14 px-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl text-base font-black transition-all",
                    location.pathname === item.path 
                      ? "bg-primary/10 text-primary" 
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Config Warning */}
      <AnimatePresence>
        {(!isSupabaseConfigured() || hasFetchError) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-12 md:top-14 left-0 right-0 z-[45] bg-red-500 text-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
              <AlertCircle className="w-3 h-3 md:w-4 h-4" />
              <span>
                {!isSupabaseConfigured() 
                  ? "Supabase not configured. Please add your credentials in AI Studio Secrets."
                  : "Failed to connect to Supabase. Please check your internet or credentials."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 pt-12 md:pt-14 pb-20 md:pb-6",
        (!isSupabaseConfigured() || hasFetchError) && "mt-8 md:mt-10"
      )}>
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-t border-surface-container-high pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 h-16 flex justify-between items-center">
          {navItems.filter(item => item.path !== '/about').map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center py-1 px-3 flex-1"
              >
                <div className={cn(
                  "transition-all duration-500 relative z-10 flex flex-col items-center gap-1",
                  isActive ? "text-primary scale-110" : "text-on-surface-variant opacity-40"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-[0.1em]">
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-x-1 inset-y-1 bg-primary/5 rounded-xl -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
