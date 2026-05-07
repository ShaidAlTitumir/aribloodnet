import React, { useState, useEffect } from 'react';
import { 
  Hospital as HospitalIcon, 
  Search, 
  ShieldCheck, 
  LogOut, 
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Hospital } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useErrorStore } from '@/src/lib/errorTracking';

const HospitalDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setFetchError } = useErrorStore();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'search'>('overview');

  // Check for saved login
  useEffect(() => {
    const saved = localStorage.getItem('mock_hospital');
    if (saved) {
      const h = JSON.parse(saved);
      setIsLoggedIn(true);
      fetchHospitalData(h.id);
    }
  }, []);

  const fetchHospitalData = async (id: string) => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Hospital Profile
      const { data: hospData, error: hospError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', id)
        .single();
      
      if (hospError) throw hospError;
      setHospital(hospData);
      localStorage.setItem('mock_hospital', JSON.stringify(hospData));
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock Login for Demo
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      alert('Supabase is not configured. Please check your environment variables.');
      return;
    }
    setLoading(true);
    
    setTimeout(async () => {
      const mockId = 'h1';
      
      const { data: existing } = await supabase.from('hospitals').select('id').eq('id', mockId).single();
      
      if (!existing) {
        await supabase.from('hospitals').insert([{
          id: mockId,
          hospital_name: 'Dhaka Central Hospital',
          district: 'Dhaka',
          contact_person: 'Dr. Ahmed Kabir',
          phone: '+880 1711-223344',
          email: 'admin@dch.gov.bd',
          subscription_plan: 'Pro',
          verified: true
        }]);
      }

      setIsLoggedIn(true);
      fetchHospitalData(mockId);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHospital(null);
    localStorage.removeItem('mock_hospital');
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-sm mx-auto px-4 py-4 md:py-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-surface-container-low"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 editorial-gradient rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-md shadow-red-100">
            <HospitalIcon className="text-white w-6 h-6 md:w-7 md:h-7" />
          </div>
          <h1 className="text-lg md:text-xl font-black text-on-surface tracking-tighter text-center mb-0.5">Hospital Portal</h1>
          <p className="text-[9px] md:text-xs text-on-surface-variant font-medium text-center mb-4 md:mb-6">Access donor network and manage profile.</p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="label-mini">Email Address</label>
              <input 
                required
                type="email"
                placeholder="hospital@example.com"
                className="input-compact"
              />
            </div>
            <div className="space-y-1">
              <label className="label-mini">Password</label>
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="input-compact"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="btn-compact w-full bg-primary text-white shadow-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-surface-container-low text-center">
            <p className="text-[9px] md:text-xs text-on-surface-variant font-medium">
              New Hospital? <button className="text-primary font-black hover:underline">Register Now</button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 space-y-10 md:space-y-16">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="w-16 h-16 md:w-24 md:h-24 editorial-gradient rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-red-200 shrink-0">
            <HospitalIcon className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <div className="min-w-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-5xl font-black text-on-surface tracking-tighter leading-none truncate">{hospital?.hospital_name}</h1>
              {hospital?.verified && <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-secondary fill-current shrink-0" />}
            </div>
            <p className="text-[10px] md:text-sm text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-70">{hospital?.district} • {hospital?.subscription_plan} Plan</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="p-4 md:p-6 bg-slate-100 text-slate-600 rounded-2xl md:rounded-[1.5rem] hover:text-primary hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 md:gap-4 bg-surface-container-low p-2 rounded-[1.5rem] md:rounded-[2rem] border border-surface-container-medium w-fit mx-auto md:mx-0">
        {[
          { id: 'overview', name: 'Overview', icon: TrendingUp },
          { id: 'search', name: 'Donors', icon: Search },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 md:gap-3 px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-[1.5rem] text-xs md:text-lg font-black transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-white text-primary shadow-lg shadow-black/5" 
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <tab.icon className="w-4 h-4 md:w-6 md:h-6" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            <div className="lg:col-span-2 space-y-6 md:space-y-10">
              <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-black/5 border border-surface-container-low">
                <h3 className="text-xl md:text-3xl font-black text-on-surface mb-8 md:mb-12 flex items-center justify-between">
                  Hospital Profile
                  <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-on-surface-variant opacity-30" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                  {[
                    { label: 'Contact Person', value: hospital?.contact_person },
                    { label: 'Phone', value: hospital?.phone },
                    { label: 'Email', value: hospital?.email },
                    { label: 'Location', value: hospital?.district },
                  ].map((item, i) => (
                    <div key={i} className="p-6 md:p-8 bg-surface-container-low rounded-[1.5rem] md:rounded-[2rem] border border-surface-container-medium/50">
                      <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60 mb-1 md:mb-2">{item.label}</div>
                      <div className="text-sm md:text-xl font-bold text-on-surface">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-10">
              <div className="bg-on-surface text-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                <h3 className="text-2xl md:text-4xl font-black mb-4 tracking-tight leading-none">Verified Partner</h3>
                <p className="text-white/60 text-sm md:text-lg mb-8 font-medium leading-relaxed">Your hospital is a verified partner in our life-saving network.</p>
                <button className="w-full py-4 md:py-6 bg-primary text-white rounded-2xl md:rounded-[1.5rem] font-black text-xs md:text-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <ShieldCheck className="w-5 h-5 md:w-7 md:h-7" />
                  View Certificate
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white p-12 md:p-24 rounded-[2rem] md:rounded-[4.5rem] shadow-xl shadow-black/5 border border-surface-container-low text-center space-y-8 md:space-y-12">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-surface-container-low rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Search className="w-10 h-10 md:w-16 md:h-16 text-on-surface-variant/20" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl md:text-6xl font-black text-on-surface tracking-tighter leading-none">Donor Network</h3>
              <p className="text-sm md:text-2xl text-on-surface-variant font-medium max-w-2xl mx-auto leading-relaxed opacity-70">
                Search our extensive donor network to find life-saving matches for your patients across Bangladesh.
              </p>
            </div>
            <Link to="/donors" className="inline-flex px-12 py-5 md:px-20 md:py-8 bg-primary text-white rounded-2xl md:rounded-[2.5rem] font-black text-base md:text-2xl shadow-2xl shadow-red-200 hover:scale-105 active:scale-95 transition-all">
              Find Donors
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
