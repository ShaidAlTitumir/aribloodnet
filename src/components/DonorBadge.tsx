import React from 'react';
import { Star, Shield, Trophy, Crown } from 'lucide-react';
import { getDonorBadge, cn } from '@/src/lib/utils';

interface DonorBadgeProps {
  totalDonations: number;
  className?: string;
  showName?: boolean;
}

export const DonorBadge = ({ totalDonations, className, showName = true }: DonorBadgeProps) => {
  const badge = getDonorBadge(totalDonations);
  
  if (!badge) return null;

  const Icon = {
    Star: Star,
    Shield: Shield,
    Trophy: Trophy,
    Crown: Crown
  }[badge.icon as 'Star' | 'Shield' | 'Trophy' | 'Crown'] || Star;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 rounded-full border shadow-sm transition-all animate-in fade-in zoom-in duration-500",
      badge.bg,
      badge.color,
      badge.border,
      className
    )}>
      <Icon className="w-3 h-3 md:w-4 md:h-4 fill-current opacity-80" />
      {showName && (
        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {badge.name}
        </span>
      )}
    </div>
  );
};
