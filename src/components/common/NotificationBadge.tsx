import React from 'react';
import { NotificationPriority } from '../../context/NotificationContext';

export interface NotificationBadgeProps {
  count?: number | string | null;
  label?: string;
  isUnread?: boolean;
  priority?: NotificationPriority;
  variant?: 'rose' | 'pink' | 'emerald' | 'purple' | 'amber' | 'neutral' | 'white';
  size?: 'sm' | 'md' | 'dot' | 'badge-overlay';
  showPing?: boolean;
  className?: string;
  id?: string;
}

const variantStyles: Record<string, string> = {
  rose: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  pink: 'bg-pink-500/15 text-pink-700 border-pink-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
  purple: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  amber: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
  neutral: 'bg-stone-500/15 text-stone-700 border-stone-500/25',
  white: 'bg-white/20 text-white border-white/30',
};

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  label,
  isUnread = false,
  priority = 'normal',
  variant = 'pink',
  size = 'sm',
  showPing = true,
  className = '',
  id,
}) => {
  const isUrgent = priority === 'urgent';
  const hasValue = count !== undefined && count !== null && count !== 0 && count !== '0';
  const showContent = hasValue || Boolean(label);

  if (!showContent && size !== 'dot') {
    return null;
  }

  const baseVariant = variantStyles[variant] || variantStyles.pink;
  const sizeClasses =
    size === 'dot'
      ? 'min-w-[8px] h-2 p-0'
      : size === 'badge-overlay'
      ? 'min-w-[18px] h-[18px] px-1 text-[9px] font-extrabold shadow-xs'
      : size === 'md'
      ? 'text-xs font-semibold px-2.5 py-0.5'
      : 'text-[10px] font-semibold px-2 py-0.5';

  // Blinking ONLY when priority is urgent! Static otherwise for professional look
  const blinkingClass = isUrgent ? 'badge-blinking ring-1 ring-rose-500/30' : '';

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center rounded-full border backdrop-blur-xs transition-all tracking-tight ${baseVariant} ${sizeClasses} ${blinkingClass} ${className}`}
    >
      {/* Subtle Ping Animation ONLY for Unread Items */}
      {isUnread && showPing && (
        <span className="relative flex h-1.5 w-1.5 mr-1 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}

      {label && <span className="truncate">{label}</span>}
      {hasValue && <span>{count}</span>}
    </span>
  );
};
