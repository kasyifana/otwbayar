import React from 'react';
import { Member, PaymentProof } from '@/types';
import { formatIDR, getMemberStatus } from '@/lib/format';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface MemberGridProps {
  members: Member[];
  proofs: PaymentProof[];
  currentMemberId?: string;
  onSelectMember?: (member: Member) => void;
}

export const MemberGrid: React.FC<MemberGridProps> = ({
  members,
  proofs,
  currentMemberId,
  onSelectMember,
}) => {
  const completedCount = members.filter((m) => m.paid_amount >= m.target_quota).length;

  return (
    <div className="bg-white rounded-[20px] p-4 border border-[#E2E8DF]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-[#172118]">
            Kesiapan Peserta ({completedCount}/{members.length})
          </h2>
          <p className="text-[11px] text-[#576458] font-tabular mt-0.5">
            Kuota per orang: {members[0] ? formatIDR(members[0].target_quota) : '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {members.map((member) => {
          const hasPending = proofs.some(
            (p) => p.member_id === member.id && p.status === 'PENDING'
          );
          const rejectedProof = proofs.find(
            (p) => p.member_id === member.id && p.status === 'REJECTED'
          );
          const status = getMemberStatus(member.paid_amount, member.target_quota, hasPending);
          const isCurrentUser = member.id === currentMemberId;

          return (
            <button
              type="button"
              key={member.id}
              onClick={() => onSelectMember && onSelectMember(member)}
              className={`p-2.5 rounded-[12px] border text-left relative flex flex-col justify-between cursor-pointer transition-all ${
                isCurrentUser
                  ? 'bg-[#EEF6ED] border-[#C2DEC0]'
                  : 'bg-[#F9FAF8] border-[#E8ECE5] hover:border-[#D5DCD1]'
              }`}
            >
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-[#172118] truncate flex items-center gap-1">
                      {member.name}
                      {isCurrentUser && (
                        <span className="text-[9px] text-emerald-800 font-medium">(Kamu)</span>
                      )}
                    </div>
                    <div className="text-[11px] font-tabular text-[#576458]">
                      {formatIDR(member.paid_amount)}
                    </div>
                  </div>
                </div>

                {/* Rejection notice if recent proof was rejected and user has no pending */}
                {rejectedProof && !hasPending && isCurrentUser && (
                  <div className="mt-2 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-800 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      Setoran ditolak: {rejectedProof.rejection_reason || 'Bukti tidak cocok'}
                    </span>
                  </div>
                )}
              </div>

              {/* Status pill badge */}
              <div className="mt-2.5 pt-1.5 border-t border-[#E8ECE5] flex items-center justify-between w-full">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[6px] border ${status.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.pill}`} />
                  {status.label}
                </span>

                {status.variant === 'completed' && (
                  <Check className="w-3.5 h-3.5 text-[#276738]" />
                )}
                {hasPending && (
                  <Clock className="w-3 h-3 text-[#8F4A00]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
