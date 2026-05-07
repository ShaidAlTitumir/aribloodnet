import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, Droplets, ExternalLink, Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Donor } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DonorListItemProps {
  donor: Donor;
}

import { useLanguage } from '@/src/contexts/LanguageContext';

import { DonorBadge } from '@/src/components/DonorBadge';

export const DonorListItem = React.memo(({ donor }: DonorListItemProps) => {
  const { t } = useLanguage();
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
      whileHover={{ y: -1, scale: 1.002 }}
      className="bg-white px-4 py-2.5 md:px-6 md:py-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-md shadow-black/5 border border-surface-container-low flex flex-col lg:flex-row items-start lg:items-center gap-3 md:gap-6 group transition-all"
    >
      {/* Left section: Blood type and main info */}
      <div className="flex items-center gap-3 md:gap-6 flex-1 w-full">
        {/* Blood Type Badge */}
        <div className="w-12 h-12 md:w-20 md:h-20 editorial-gradient rounded-[1rem] md:rounded-[1.5rem] flex flex-col items-center justify-center text-white shadow-lg shadow-red-100 shrink-0">
          <span className="text-lg md:text-3xl font-black tracking-tighter leading-none">{donor.blood_type}</span>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1 md:mb-2">
            <Link to={`/donor/${donor.id}`} className="hover:underline">
              <h3 className="text-base md:text-2xl font-black text-on-surface group-hover:text-primary transition-colors leading-tight truncate tracking-tighter">
                {donor.full_name}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border whitespace-nowrap shadow-sm",
                availabilityColors[donor.availability]
              )}>
                {donor.availability === 'Available' ? t('donors.list.available') : 
                 donor.availability === 'Not Available' ? t('donors.list.not_available') : 
                 donor.availability === 'Emergency Only' ? t('donors.list.emergency_only') : 
                 donor.availability}
              </span>
              <DonorBadge totalDonations={donor.total_donations} />
              {donor.verified && (
                <div className="flex items-center gap-1 text-secondary font-black text-[8px] md:text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                  {t('donors.list.verified')}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] md:text-base text-on-surface-variant font-bold opacity-70">
            <div className="flex items-center gap-1 md:gap-1.5">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="truncate">{donor.thana}, {donor.district}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span>
                {donor.last_donation_date 
                  ? formatDistanceToNow(new Date(donor.last_donation_date), { addSuffix: true })
                  : t('donors.list.never')}
              </span>
            </div>
            <div className="flex items-center gap-1 md:gap-1.5">
              <Droplets className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span>{donor.total_donations} {t('donors.list.donations')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right section: Contact and Actions */}
      <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-container-low">
        <div className="flex flex-col lg:items-end gap-0 md:gap-0.5">
          <div className="flex items-center gap-1.5 md:gap-2 text-lg md:text-4xl font-black text-on-surface tracking-tighter">
            <Phone className="w-5 h-5 md:w-8 md:h-8 text-primary" />
            <span>{donor.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 shrink-0 ml-auto lg:ml-6">
          <Link 
            to={`/donor/${donor.id}`}
            className="p-2 md:p-4 bg-surface-container-low text-on-surface rounded-lg md:rounded-[1rem] hover:bg-surface-container-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
            title={t('donors.list.view_profile')}
          >
            <ExternalLink className="w-3.5 h-3.5 md:w-6 md:h-6" />
          </Link>
          <a 
            href={`tel:${donor.phone}`}
            className="p-2 md:p-4 bg-primary text-white rounded-lg md:rounded-[1rem] shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all"
            title={t('donors.list.call_now')}
          >
            <Phone className="w-3.5 h-3.5 md:w-6 md:h-6" />
          </a>
        </div>
      </div>
    </motion.div>
  );
});
DonorListItem.displayName = 'DonorListItem';
