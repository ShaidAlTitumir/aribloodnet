import React, { useState } from 'react';
import { Hospital, MapPin, Phone, Clock, AlertTriangle, Calendar, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmergencyRequest } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/src/hooks/useAuth';

interface EmergencyCardProps {
  request: EmergencyRequest;
  onDelete?: (id: string) => void;
  userLocation?: { district: string | null; thana: string | null } | null;
}

import { useLanguage } from '@/src/contexts/LanguageContext';

export const EmergencyCard = React.memo(({ request, onDelete, userLocation }: EmergencyCardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isOwner = user?.id === request.user_id;
  const isNear = userLocation?.district === request.district && userLocation?.thana === request.thana;
  const isSameDistrict = userLocation?.district === request.district && !isNear;

  const urgencyColors = {
    'Critical': 'bg-red-50 text-red-700 border-red-100',
    'Urgent': 'bg-orange-50 text-orange-700 border-orange-100',
    'Within 24 hours': 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={cn(
        "bg-surface-container-lowest rounded-3xl shadow-sm border p-3 md:p-4 transition-all hover:shadow-md flex flex-col group relative overflow-hidden",
        (!isOwner && isNear) ? "border-primary/30 ring-1 ring-primary/10" : "border-surface-container-high",
        ((!isOwner && (isNear || isSameDistrict)) || request.status === 'Fulfilled') && "pt-8 md:pt-10"
      )}
    >
      {/* Near You Badge */}
      {!isOwner && (isNear || isSameDistrict) && (
        <div className={cn(
          "absolute top-0 left-0 px-3 py-1 rounded-br-2xl text-[11px] font-black uppercase tracking-widest z-10 shadow-sm",
          isNear ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
        )}>
          {isNear ? t('emergency.card.near_you') : request.district}
        </div>
      )}
      {/* Top Section: Blood Type + Name + Bags */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 md:w-12 md:h-12 editorial-gradient rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200/50 shrink-0 border border-white/20">
          <span className="text-lg md:text-xl font-black leading-none tracking-tighter">{request.blood_type_needed}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-black text-on-surface leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {request.patient_name}
              </h3>
              <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[11px] md:text-sm font-bold mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-primary/40" />
                <span className="truncate">{request.thana}, {request.district}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <span className={cn(
                "px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-xs font-black uppercase tracking-widest border whitespace-nowrap shadow-sm",
                urgencyColors[request.urgency as keyof typeof urgencyColors]
              )}>
                {request.urgency === 'Urgent' ? t('emergency.modal.urgency_urgent') : 
                 request.urgency === 'Critical' ? t('emergency.modal.urgency_critical') : 
                 request.urgency === 'Within 24 hours' ? t('emergency.modal.urgency_24h') : 
                 request.urgency}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary opacity-60 leading-none mb-1">{t('emergency.card.bags')}</span>
                <span className="text-base md:text-xl font-black text-primary leading-none">{request.bags_needed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Section */}
      <div className="mb-2">
        <div className="p-2 bg-red-50/30 rounded-xl border border-red-100/50">
          <p className="text-[11px] md:text-sm font-black text-on-surface leading-snug line-clamp-2">
            {request.reason || t('emergency.card.medical_emergency')}
          </p>
        </div>
      </div>

      {/* Details Row: Hospital & Date */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-surface-container-low/40 rounded-xl border border-surface-container-medium/30">
          <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-0.5">{t('emergency.modal.hospital')}</div>
          <div className="text-xs md:text-sm font-bold truncate text-on-surface">
            {request.hospital_name}
          </div>
        </div>
        <div className="p-2 bg-surface-container-low/40 rounded-xl border border-surface-container-medium/30">
          <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-0.5">{t('emergency.card.needed')}</div>
          <div className="text-xs md:text-sm font-bold truncate text-secondary">
            {request.needed_date ? new Date(request.needed_date).toLocaleDateString() : t('emergency.card.asap')}
          </div>
        </div>
        <div className="p-3 bg-surface-container-low/60 rounded-xl border border-surface-container-medium/50 col-span-2 flex items-center justify-center">
          <div className="text-xl md:text-2xl font-black text-on-surface tracking-tight">
            {request.contact_number}
          </div>
        </div>
      </div>

      {/* Bottom Section: Help Now Button */}
      <div className="flex gap-2">
        <a 
          href={request.status === 'Fulfilled' ? '#' : `tel:${request.contact_number}`}
          onClick={(e) => request.status === 'Fulfilled' && e.preventDefault()}
          className={cn(
            "btn-compact bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200/50 emergency-pulse flex items-center justify-center gap-2 rounded-2xl transition-all h-10 md:h-12 text-sm md:text-base font-black",
            isOwner ? "flex-1" : "w-full",
            request.status === 'Fulfilled' && "opacity-50 grayscale cursor-not-allowed pointer-events-none"
          )}
        >
          <Phone className="w-4 h-4" />
          {t('emergency.card.help_now')}
        </a>
        
        {isOwner && onDelete && (
          <div className="relative flex gap-1">
            <AnimatePresence mode="wait">
              {isConfirmingDelete ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex gap-1"
                >
                  <button
                    onClick={() => onDelete(request.id)}
                    className="w-10 md:w-12 h-10 md:h-12 flex items-center justify-center bg-red-600 text-white rounded-2xl transition-all shadow-lg shadow-red-200"
                    title={t('common.confirm') || 'Confirm'}
                  >
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="w-10 md:w-12 h-10 md:h-12 flex items-center justify-center bg-surface-container-high text-on-surface-variant rounded-2xl transition-all"
                    title={t('common.cancel') || 'Cancel'}
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="delete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-10 md:w-12 h-10 md:h-12 flex items-center justify-center bg-surface-container-high text-on-surface-variant hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all border border-surface-container-highest"
                  title={t('common.delete') || 'Delete'}
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Decorative Background Icon */}
      <div className="absolute bottom-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none">
        <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-primary" />
      </div>

      {request.status === 'Fulfilled' && (
        <div className="absolute top-0 right-0 z-20">
          <div className="bg-green-600 text-white px-3 py-1 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-1.5">
            <Check className="w-3 h-3" />
            {t('emergency.card.fulfilled')}
          </div>
        </div>
      )}
    </motion.div>
  );
});
EmergencyCard.displayName = 'EmergencyCard';
