import React, { useState } from 'react';
import { Group, Member } from '@/types';
import { Share2, Check, Copy, MessageSquare, Shield, X } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  members: Member[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  group,
  members,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedCoord, setCopiedCoord] = useState<boolean>(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === 'number') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedCoord(true);
      setTimeout(() => setCopiedCoord(false), 2000);
    }
  };

  const shareWhatsApp = (memberName: string, url: string) => {
    const message = `Halo ${memberName}! Yuk cek & pantau tabungan patungan glamping kita di "${group.name}". Klik link ini untuk langsung buka tanpa password:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#245229]" />
              Bagi Magic Link Patungan
            </h2>
            <p className="text-xs text-[#576458]">Tiap peserta punya link akses instan</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#F4F6F4] flex items-center justify-center text-[#576458] hover:bg-[#EAEFE8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Coordinator link */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                Link Rahasia Bendahara
              </span>
              <button
                onClick={() =>
                  copyToClipboard(`${baseUrl}/?token=${group.coordinator_token}`)
                }
                className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
              >
                {copiedCoord ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedCoord ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-800/80">
              Simpan link ini untuk menyetujui setoran dan mengedit pos anggaran.
            </p>
          </div>

          {/* Member Links list */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 block">
              Daftar Magic Link Peserta ({members.length} Orang)
            </span>

            {members.map((member, i) => {
              const memberUrl = `${baseUrl}/?token=${member.member_token}`;
              const isCopied = copiedIndex === i;

              return (
                <div
                  key={member.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {member.name[0]}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#182315] truncate">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[#576458] truncate">
                        {memberUrl}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(memberUrl, i)}
                      title="Salin link"
                      className="p-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer text-xs"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => shareWhatsApp(member.name, memberUrl)}
                      title="Share ke WhatsApp"
                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
