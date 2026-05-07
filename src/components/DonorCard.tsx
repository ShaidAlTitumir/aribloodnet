import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, Droplets, ExternalLink, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Donor } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface DonorCardProps {
  donor: Donor;
}

export const DonorCard: React.FC<DonorCardProps> = ({ donor }) => {
  const { t, language } = useLanguage();
  const availabilityColors = {
    'Available': 'bg-green-50 text-green-700 border-green-100',
    'Not Available': 'bg-slate-50 text-slate-500 border-slate-100',
    'Emergency Only': 'bg-orange-50 text-orange-700 border-orange-100',
  };

  const bmi = donor.weight_kg && donor.height_cm 
    ? (donor.weight_kg / Math.pow(donor.height_cm / 100, 2)).toFixed(1) 
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="compact-card flex flex-col group relative overflow-hidden"
    >
      {/* Blood Type Badge - Overlapping */}
      <div className="absolute -top-0.5 -left-0.5 w-8 h-8 md:w-10 md:h-10 editorial-gradient rounded-md md:rounded-lg flex flex-col items-center justify-center text-white shadow-md shadow-red-200 z-10">
        <span className="text-xs md:text-sm font-black tracking-tighter">{donor.blood_type}</span>
      </div>

      <div className="flex justify-between items-start mb-2 md:mb-3 pl-9 md:pl-12">
        <div className="flex flex-col min-w-0">
          <Link to={`/donor/${donor.id}`} className="hover:underline group/name">
            <h3 className="text-xs md:text-sm font-black text-on-surface group-hover/name:text-primary transition-colors leading-tight line-clamp-1">
              {donor.full_name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-on-surface-variant text-[8px] md:text-[10px] font-bold mt-0.5">
            <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary/60" />
            <span className="truncate">{donor.thana}, {donor.district}</span>
          </div>
          
          {bmi && (
            <div className="mt-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-surface-container-low rounded text-[7px] md:text-[9px] font-black uppercase tracking-widest text-on-surface-variant border border-surface-container-medium w-fit">
              <Activity className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary" />
              BMI: {bmi}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 md:gap-1 shrink-0">
          <span className={cn(
            "px-1.5 md:px-2 py-0.5 rounded-full text-[6px] md:text-[8px] font-black uppercase tracking-widest border whitespace-nowrap shadow-sm",
            availabilityColors[donor.availability]
          )}>
            {donor.availability === 'Available' ? t('donors.list.available') : 
             donor.availability === 'Not Available' ? t('donors.list.not_available') : 
             t('donors.list.emergency_only')}
          </span>
          {donor.verified && (
            <div className="flex items-center gap-0.5 text-secondary font-bold text-[6px] md:text-[8px] uppercase tracking-wider">
              <ShieldCheck className="w-2 h-2 md:w-2.5 md:h-2.5 fill-current" />
              {t('donors.list.verified')}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
        <div className="p-1 md:p-1.5 bg-surface-container-low rounded-lg border border-surface-container-medium">
          <div className="label-mini">{language === 'en' ? 'Last Donated' : 'সর্বশেষ রক্তদান'}</div>
          <div className="value-compact truncate">
            {donor.last_donation_date 
              ? formatDistanceToNow(new Date(donor.last_donation_date), { addSuffix: true })
              : t('donors.list.never')}
          </div>
        </div>

        <div className="p-1 md:p-1.5 bg-surface-container-low rounded-lg border border-surface-container-medium">
          <div className="label-mini">{language === 'en' ? 'Total Donations' : 'মোট রক্তদান'}</div>
          <div className="value-compact truncate">
            {donor.total_donations > 0 ? `${donor.total_donations} ${language === 'en' ? 'times' : 'বার'}` : t('donors.list.never')}
          </div>
        </div>
      </div>

      <div className="mb-2 md:mb-3">
        <div className="flex items-center gap-x-1.5 md:gap-x-2 text-sm md:text-xl pt-1.5 border-t border-surface-container-low overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
            <span className="font-black text-on-surface">{donor.phone}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-1 md:gap-1.5">
        <Link 
          to={`/donor/${donor.id}`}
          className="py-1 md:py-1.5 bg-surface-container-low text-on-surface font-black rounded-md active:scale-95 transition-all flex items-center justify-center gap-1 text-[8px] md:text-[10px]"
        >
          <ExternalLink className="w-2 h-2 md:w-2.5 md:h-2.5" />
          {t('donors.list.view_profile')}
        </Link>
        <a 
          href={`tel:${donor.phone}`}
          className="py-1 md:py-1.5 bg-primary text-white font-black rounded-md shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 text-[8px] md:text-[10px]"
        >
          <Phone className="w-2 h-2 md:w-2.5 md:h-2.5" />
          {t('donors.list.call_now')}
        </a>
      </div>

      {donor.organ_donor && (
        <div className="absolute bottom-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
          <Droplets className="w-8 h-8 md:w-12 md:h-12 text-primary" />
        </div>
      )}
    </motion.div>
  );
};
