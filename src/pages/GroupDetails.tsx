import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  ArrowLeft, 
  UserPlus, 
  UserMinus,
  ShieldCheck,
  Phone,
  Mail,
  Droplets,
  ChevronRight,
  Info,
  Facebook,
  Globe,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  ArrowRight,
  Search,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { Group, GroupMember, Profile } from '@/src/types';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/hooks/useAuth';
import { cn, formatBloodType, DISTRICTS, THANAS_BY_DISTRICT } from '@/src/lib/utils';
import { DonorBadge } from '@/src/components/DonorBadge';
import { useErrorStore } from '@/src/lib/errorTracking';

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setFetchError } = useErrorStore();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchingDonors, setSearchingDonors] = useState(false);
  const [donorsList, setDonorsList] = useState<Profile[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    district: '',
    thana: '',
    logo_url: '',
    facebook_url: '',
    website_url: ''
  });

  const fetchGroupDetails = async () => {
    if (!id || !isSupabaseConfigured()) return;
    setLoading(true);

    try {
      // Fetch Group Info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);
      setEditFormData({
        name: groupData.name,
        description: groupData.description || '',
        district: groupData.district,
        thana: groupData.thana,
        logo_url: groupData.logo_url || '',
        facebook_url: groupData.facebook_url || '',
        website_url: groupData.website_url || ''
      });

      // Fetch Members with Profiles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('group_id', id)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData as any);

      // Check if current user is member/admin
      if (user) {
        const currentUserMember = membersData?.find(m => m.user_id === user.id);
        setIsMember(!!currentUserMember);
        setIsAdmin(currentUserMember?.role === 'Admin' || groupData.created_by === user.id);
      }
    } catch (err: any) {
      console.error('Error fetching group details:', err);
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError(true);
      }
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id, user]);

  const handleJoinLeave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!id) return;

    setJoining(true);
    try {
      if (isMember) {
        // Leave Group
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsMember(false);
        setIsAdmin(false);
      } else {
        // Join Group
        const { error } = await supabase
          .from('group_members')
          .insert([{
            group_id: id,
            user_id: user.id,
            role: 'Member'
          }]);

        if (error) throw error;
        setIsMember(true);
      }
      fetchGroupDetails();
    } catch (err: any) {
      console.error('Error joining/leaving group:', err);
      alert(err.message || 'Action failed');
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAdmin) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update(editFormData)
        .eq('id', id);

      if (error) throw error;
      setShowEditModal(false);
      fetchGroupDetails();
    } catch (err: any) {
      console.error('Error updating group:', err);
      alert(err.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id || !isAdmin) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/groups');
    } catch (err: any) {
      console.error('Error deleting group:', err);
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const searchDonors = async (query: string) => {
    if (!query || query.length < 3) {
      setDonorsList([]);
      return;
    }
    setSearchingDonors(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setDonorsList(data || []);
    } catch (err) {
      console.error('Error searching donors:', err);
    } finally {
      setSearchingDonors(false);
    }
  };

  const addMember = async (memberId: string) => {
    if (!id || !isAdmin) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: id,
          user_id: memberId,
          role: 'Member'
        }]);

      if (error) {
        if (error.code === '23505') {
          alert(t('groups.details.already_member'));
        } else {
          throw error;
        }
      } else {
        fetchGroupDetails();
        setShowAddMemberModal(false);
      }
    } catch (err: any) {
      console.error('Error adding member:', err);
      alert(err.message || 'Failed to add member');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (donorSearch) searchDonors(donorSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [donorSearch]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/groups')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-low hover:bg-surface-container-medium rounded-2xl text-on-surface-variant font-black transition-all group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        {t('common.back')}
      </button>

      {/* Hero Section */}
      <div className="relative bg-white p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-surface-container-low shadow-2xl shadow-black/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-blue-50 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-blue-600 shadow-inner overflow-hidden shrink-0">
            {group.logo_url ? (
              <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Building2 className="w-16 h-16 md:w-24 md:h-24" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-7xl font-black text-on-surface tracking-tighter leading-none">
                {group.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-on-surface-variant opacity-60 font-bold text-sm md:text-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{group.thana}, {group.district}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-20 hidden md:block" />
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{members.length} {t('groups.card.members')}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-current rounded-full opacity-20 hidden md:block" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(group.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </div>

            <p className="text-sm md:text-xl text-on-surface-variant font-medium leading-relaxed opacity-80 max-w-3xl">
              {group.description || 'No description provided.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={handleJoinLeave}
                disabled={joining}
                className={cn(
                  "w-full sm:w-auto px-10 py-5 md:px-14 md:py-6 rounded-2xl md:rounded-[2rem] font-black shadow-2xl transition-all text-base md:text-xl flex items-center justify-center gap-4",
                  isMember 
                    ? "bg-surface-container-high text-on-surface hover:bg-red-50 hover:text-red-600 shadow-black/5" 
                    : "bg-primary text-white shadow-red-200 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {joining ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isMember ? (
                  <>
                    <UserMinus className="w-6 h-6 md:w-8 md:h-8" />
                    {t('groups.details.leave_btn')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
                    {t('groups.details.join_btn')}
                  </>
                )}
              </button>

              {isAdmin && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 sm:flex-none p-5 md:p-6 bg-surface-container-high text-on-surface hover:bg-blue-50 hover:text-blue-600 rounded-2xl md:rounded-[2rem] font-black transition-all"
                    title={t('groups.details.edit_btn')}
                  >
                    <Edit className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="flex-1 sm:flex-none p-5 md:p-6 bg-surface-container-high text-on-surface hover:bg-red-50 hover:text-red-600 rounded-2xl md:rounded-[2rem] font-black transition-all"
                    title={t('groups.details.delete_btn')}
                  >
                    {deleting ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl md:text-5xl font-black text-on-surface tracking-tighter">
              {t('groups.details.members_title')}
            </h2>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button 
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-full font-black text-sm hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t('groups.details.add_member')}
                </button>
              )}
              <div className="px-4 py-2 bg-surface-container-low rounded-full text-on-surface-variant font-black text-xs">
                {members.length} {t('groups.card.members')}
              </div>
            </div>
          </div>

          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={member.profile?.id ? `/donor/${member.profile.id}` : '#'}
                  className="group bg-white p-6 rounded-[2rem] border border-surface-container-low shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all flex items-center gap-6"
                >
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-surface-container-low rounded-2xl flex items-center justify-center text-on-surface-variant font-black text-2xl overflow-hidden">
                      {member.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    {member.role === 'Admin' && (
                      <div className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-lg shadow-lg" title={t('groups.details.admin_badge')}>
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg md:text-xl font-black text-on-surface truncate group-hover:text-primary transition-colors">
                        {member.profile?.full_name}
                      </h4>
                      {member.profile?.total_donations !== undefined && (
                        <DonorBadge totalDonations={member.profile.total_donations} />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-xs font-bold mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary/40" />
                      <span>{member.profile?.thana}, {member.profile?.district}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                        <Droplets className="w-3 h-3" />
                        <span>{formatBloodType(member.profile?.blood_type || '')}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-surface-container-medium">
              <Users className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold opacity-60">
                {t('groups.details.no_members')}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-surface-container-low shadow-xl shadow-black/5 space-y-8">
            <h3 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-3">
              <Info className="w-6 h-6 text-primary" />
              {t('groups.details.about')}
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{t('groups.details.location')}</p>
                  <p className="text-base font-black text-on-surface">{group.thana}, {group.district}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Registered On</p>
                  <p className="text-base font-black text-on-surface">
                    {new Date(group.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {(group.facebook_url || group.website_url) && (
                <div className="pt-6 border-t border-surface-container-low space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{t('groups.details.social_links')}</p>
                  <div className="flex flex-wrap gap-3">
                    {group.facebook_url && (
                      <a 
                        href={group.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#1877F2]/10 text-[#1877F2] rounded-xl font-black text-sm hover:bg-[#1877F2] hover:text-white transition-all"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </a>
                    )}
                    {group.website_url && (
                      <a 
                        href={group.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-low text-on-surface rounded-xl font-black text-sm hover:bg-on-surface hover:text-white transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-surface-container-low">
              <div className="p-6 bg-blue-50 rounded-2xl space-y-3">
                <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Community Guidelines
                </h4>
                <p className="text-xs text-blue-800/70 font-medium leading-relaxed">
                  This group is a community of voluntary blood donors. Please maintain professionalism and respect when interacting with members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <form onSubmit={handleUpdateGroup} className="flex flex-col h-full overflow-hidden">
                <div className="p-8 md:p-10 border-b flex justify-between items-center bg-surface-container-low">
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-black text-on-surface tracking-tighter">{t('groups.modal.edit_title')}</h2>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">{group.name}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
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
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.description')}</label>
                    <textarea 
                      required
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.district')}</label>
                      <select 
                        required
                        value={editFormData.district}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, district: e.target.value, thana: '' }))}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none appearance-none"
                      >
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.thana')}</label>
                      <select 
                        required
                        value={editFormData.thana}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, thana: e.target.value }))}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none appearance-none"
                      >
                        {(THANAS_BY_DISTRICT[editFormData.district] || []).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.facebook')}</label>
                      <input 
                        value={editFormData.facebook_url}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.website')}</label>
                      <input 
                        value={editFormData.website_url}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, website_url: e.target.value }))}
                        className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">{t('groups.modal.logo_url')}</label>
                    <input 
                      value={editFormData.logo_url}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="w-full px-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-2xl text-lg font-bold outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-8 md:p-12 border-t bg-surface-container-low">
                  <button 
                    type="submit"
                    disabled={updating}
                    className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                  >
                    {updating ? t('common.loading') : t('groups.modal.update_btn')}
                    {!updating && <ArrowRight className="w-6 h-6" />}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMemberModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b flex justify-between items-center bg-surface-container-low">
                <h2 className="text-2xl font-black text-on-surface tracking-tighter">{t('groups.details.add_member')}</h2>
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-2 hover:bg-surface-container-medium rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                  <input 
                    autoFocus
                    placeholder={t('groups.details.search_donors')}
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-2xl font-bold outline-none border-2 border-transparent focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-4">
                  {searchingDonors ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : donorsList.length > 0 ? (
                    donorsList.map((donor) => (
                      <div 
                        key={donor.id}
                        className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-transparent hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-on-surface-variant font-black text-lg">
                            {donor.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-on-surface">{donor.full_name}</p>
                            <div className="flex items-center gap-1 text-xs font-bold text-on-surface-variant opacity-60">
                              <MapPin className="w-3 h-3 text-primary/40" />
                              <span>{donor.thana}, {donor.district}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => addMember(donor.id)}
                          className="px-4 py-2 bg-primary text-white rounded-xl font-black text-sm hover:scale-105 active:scale-95 transition-all"
                        >
                          {t('common.add') || 'Add'}
                        </button>
                      </div>
                    ))
                  ) : donorSearch.length >= 3 ? (
                    <p className="text-center py-8 text-on-surface-variant font-bold opacity-60">
                      {t('common.no_results')}
                    </p>
                  ) : (
                    <p className="text-center py-8 text-on-surface-variant font-bold opacity-40 text-sm">
                      Type at least 3 characters to search
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter">
                  {t('groups.details.delete_btn')}?
                </h2>
                <p className="text-on-surface-variant font-medium opacity-70">
                  {t('groups.details.delete_confirm')}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {deleting ? (
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      {t('common.confirm') || 'Confirm Delete'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="w-full py-4 bg-surface-container-low text-on-surface rounded-2xl font-black text-lg hover:bg-surface-container-medium transition-all"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupDetails;
