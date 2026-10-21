import React from 'react';
import { formatIDR, getDaysRemaining, formatTripDays } from '@/lib/format';
import { Tent, MapPin, Calendar, ShieldCheck, ChevronRight, Plus, X } from 'lucide-react';

export interface UserTripItem {
  groupId: string;
  groupName: string;
  location: string;
  tripDate: string;
  role: string;
  token: string;
  targetAmount: number;
  currentAmount: number;
}

interface TripSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: UserTripItem[];
  currentTripId?: string;
  onSelectTrip: (trip: UserTripItem) => void;
  onCreateNewTrip: () => void;
}

export const TripSelectorModal: React.FC<TripSelectorModalProps> = ({
  isOpen,
  onClose,
  trips,
  currentTripId,
  onSelectTrip,
  onCreateNewTrip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <Tent className="w-4 h-4 text-[#245229]" />
              Daftar Trip Glamping Kamu
            </h2>
            <p className="text-xs text-[#576458]">Pilih trip yang ingin kamu buka atau kelola</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#F4F6F4] flex items-center justify-center text-[#576458] hover:bg-[#EAEFE8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {trips.length === 0 ? (
            <div className="text-center py-6 text-stone-500 space-y-2">
              <p className="text-xs font-semibold text-[#182315]">Belum Ada Trip Lain Terdaftar</p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Trip yang sedang aktif: <strong>Glamping Riverside Ciwidey</strong>.<br/>
                Klik tombol di bawah jika ingin membuat grup trip baru.
              </p>
            </div>
          ) : (
            trips.map((t) => {
              const daysLeft = getDaysRemaining(t.tripDate);
              const isSelected = t.groupId === currentTripId;
              const percent = t.targetAmount > 0 ? Math.min(100, Math.round((t.currentAmount / t.targetAmount) * 100)) : 0;

              return (
                <div
                  key={t.groupId}
                  onClick={() => {
                    onSelectTrip(t);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-[#245229] bg-[#EEF6ED]'
                      : 'border-stone-200 bg-[#F9FAF8] hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#172118]">{t.groupName}</span>
                        {t.role === 'COORDINATOR' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                            Bendahara
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                        {t.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{t.location}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{new Date(t.tripDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 mt-1" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/60 font-tabular text-stone-600">
                    <span>Kas: {formatIDR(t.currentAmount)} ({percent}%)</span>
                    <span className={daysLeft < 0 ? 'text-stone-400 font-medium' : 'text-amber-800 font-medium'}>
                      {formatTripDays(daysLeft)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <button
            onClick={() => {
              onClose();
              onCreateNewTrip();
            }}
            className="w-full py-2.5 rounded-xl bg-[#245229] hover:bg-[#1C3B20] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Trip Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
