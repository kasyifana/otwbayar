import React from 'react';
import { Group, Member } from '@/types';
import { getDaysRemaining } from '@/lib/format';
import { Calendar, MapPin, Share2, Plus, LogOut, ChevronDown } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  group: Group;
  currentMember: Member | null;
  isCoordinator: boolean;
  onShare: () => void;
  onCreateNew?: () => void;
  onOpenTripSelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  group,
  currentMember,
  isCoordinator,
  onShare,
  onCreateNew,
  onOpenTripSelector,
}) => {
  const { data: session } = useSession();
  const daysLeft = getDaysRemaining(group.trip_date);

  return (
    <header className="sticky top-0 z-40 bg-[#1C3B20]/95 backdrop-blur-xl text-white rounded-b-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-b border-[#294F2E]/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-3">
        {/* Top bar: Brand + Trip Switcher pill + Action icons */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: App Title or Trip Switcher in HIG Pill style */}
          {onOpenTripSelector ? (
            <button
              onClick={onOpenTripSelector}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-xs font-semibold text-emerald-100"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ganti Trip</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300 transition-transform group-hover:translate-y-0.5" />
            </button>
          ) : (
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">
              otwbayar
            </span>
          )}

          {/* Right: Actions (Trip in countdown badge, Share, Create Trip) */}
          <div className="flex items-center gap-1.5">
            {daysLeft >= 0 && (
              <div className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium text-emerald-100 font-tabular">
                <span className="text-emerald-300/80 mr-1 text-[10px]">Trip:</span>
                <strong className="text-[#FFBE98] font-bold">{daysLeft === 0 ? 'Hari H' : `${daysLeft} Hari`}</strong>
              </div>
            )}

            {isCoordinator && (
              <button
                onClick={onShare}
                aria-label="Share invite link"
                title="Bagi Invite Link"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-emerald-100 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onCreateNew && (
              <button
                onClick={onCreateNew}
                aria-label="Buat trip baru"
                title="Buat Trip Baru"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#D96B43] hover:bg-[#c65e38] active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Trip Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Middle: Prominent Trip Title & Info (Apple Large Title hierarchy) */}
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight leading-snug line-clamp-1">
              {group.name}
            </h1>
            {isCoordinator && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Bendahara
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-1 text-xs text-emerald-200/80">
            {group.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate max-w-[160px]">{group.location}</span>
              </span>
            )}
            {group.location && <span className="opacity-40">•</span>}
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>
                {new Date(group.trip_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </span>
          </div>
        </div>

        {/* Bottom subtle profile strip */}
        {currentMember && (
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                style={{ backgroundColor: currentMember.avatar_color }}
              >
                {currentMember.name[0]}
              </span>
              <span className="truncate">
                <strong className="text-white font-medium">{currentMember.name}</strong>
                {session?.user?.email && (
                  <span className="text-[10px] text-emerald-300/70 ml-1">
                    ({session.user.email})
                  </span>
                )}
              </span>
            </div>

            {session?.user && (
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-200/80 hover:text-white px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
