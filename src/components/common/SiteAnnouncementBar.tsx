import React from 'react';
import { Sparkles, AlertTriangle, Megaphone, CheckCircle2, X } from 'lucide-react';
import { Announcement } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationBadge } from './NotificationBadge';

interface SiteAnnouncementBarProps {
  announcements: Announcement[];
  dismissedAnnouncements?: number[];
  onDismissAnnouncement?: (id: number) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenBookingModal?: () => void;
}

export const SiteAnnouncementBar: React.FC<SiteAnnouncementBarProps> = ({
  announcements,
  dismissedAnnouncements = [],
  onDismissAnnouncement,
  onNavigateTab,
  onOpenBookingModal,
}) => {
  const { isAnnouncementViewed, markAnnouncementViewed } = useNotifications();

  // Only persistent UNLESS viewed - once viewed anywhere, it disappears!
  const unviewedAnnouncements = announcements.filter(
    (a) => a.is_active && !isAnnouncementViewed(a.id) && !dismissedAnnouncements.includes(a.id)
  );

  if (unviewedAnnouncements.length === 0) {
    return null;
  }

  const handleDismiss = (id: number) => {
    markAnnouncementViewed(id);
    onDismissAnnouncement?.(id);
  };

  return (
    <div className="flex flex-col w-full z-30">
      {unviewedAnnouncements.map((a) => {
        const isAlert = a.type === 'alert';
        const isPromo = a.type === 'promo';
        const isMaintenance = a.type === 'maintenance';

        return (
          <div
            key={a.id}
            id={`site-announcement-${a.id}`}
            role="region"
            aria-label="Platform Announcement"
            className={`border-b text-xs py-2 px-3 sm:px-4 flex items-center justify-between transition-all duration-300 shadow-2xs backdrop-blur-md ${
              isAlert
                ? 'bg-rose-950/90 text-rose-50 border-rose-800/60'
                : isPromo
                ? 'bg-gradient-to-r from-purple-950/90 via-pink-950/90 to-rose-950/90 text-pink-50 border-pink-800/40'
                : isMaintenance
                ? 'bg-amber-950/90 text-amber-100 border-amber-800/40'
                : 'bg-stone-900/90 text-stone-100 border-stone-800/50'
            }`}
          >
            <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <div className="relative flex items-center justify-center shrink-0">
                  {isAlert ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  ) : isPromo ? (
                    <Sparkles className="w-4 h-4 shrink-0 text-pink-300" />
                  ) : (
                    <Megaphone className="w-4 h-4 shrink-0 text-amber-300" />
                  )}
                  {isAlert && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>

                {/* Clean, semi-transparent badge with blinking for urgent alerts */}
                <NotificationBadge
                  label={a.type.toUpperCase()}
                  variant={isAlert ? 'rose' : isPromo ? 'pink' : isMaintenance ? 'amber' : 'neutral'}
                  priority={isAlert ? 'urgent' : 'normal'}
                  isUnread={true}
                  showPing={false}
                  size="sm"
                  className="shrink-0"
                />

                <span className="font-bold truncate text-[11px] sm:text-xs text-white/95">
                  {a.title}
                </span>
                <span className="hidden md:inline truncate opacity-85 text-[11px] text-white/80">
                  — {a.message}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {a.link_url && a.link_text && (
                  <button
                    onClick={() => {
                      handleDismiss(a.id);
                      const targetUrl = a.link_url;
                      if (targetUrl) {
                        if (targetUrl.startsWith('tab:')) {
                          onNavigateTab?.(targetUrl.replace('tab:', ''));
                        } else if (targetUrl === 'booking') {
                          onOpenBookingModal?.();
                        } else if (onNavigateTab) {
                          onNavigateTab(targetUrl);
                        }
                      }
                    }}
                    className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-gray-900 hover:bg-pink-50 hover:text-pink-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    {a.link_text}
                  </button>
                )}

                {/* Mark as Viewed Button - explicitly dismisses the persistent banner once viewed */}
                <button
                  onClick={() => handleDismiss(a.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20"
                  title="Mark this announcement as viewed so it doesn't show again"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Viewed</span>
                </button>

                {/* Close / Dismiss */}
                <button
                  onClick={() => handleDismiss(a.id)}
                  className="p-1 hover:bg-black/30 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss banner"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
