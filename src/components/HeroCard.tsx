import React from 'react';
import { formatIDR } from '@/lib/format';
import { Check } from 'lucide-react';

interface HeroCardProps {
  currentAmount: number;
  targetAmount: number;
  progressPercent: number;
  remainingAmount: number;
  remainingCash?: number;
  memberCount?: number;
  onQuickPay: () => void;
  onQuickExpense: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  currentAmount,
  targetAmount,
  progressPercent,
  remainingAmount,
  remainingCash,
  memberCount = 0,
  onQuickPay,
  onQuickExpense,
}) => {
  const isGoalReached = currentAmount >= targetAmount && targetAmount > 0;

  return (
    <div className="bg-[#1C3B20] text-white p-5 rounded-[20px] border border-[#142C18]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-200">
          Kas Tabungan Glamping
        </span>
        <span className="text-xs font-tabular font-semibold bg-[#132C17] px-2 py-0.5 rounded-full text-emerald-200">
          {progressPercent}%
        </span>
      </div>

      <div className="my-3">
        <div className="text-3xl font-bold font-tabular text-white tracking-tight">
          {formatIDR(currentAmount)}
        </div>
        <div className="text-xs text-emerald-200/80 font-tabular mt-1 flex items-center justify-between">
          <span>Target iuran: {formatIDR(targetAmount)}</span>
          {typeof remainingCash === 'number' && (
            <span className="text-[#FFBE98] font-semibold">Sisa Kas: {formatIDR(remainingCash)}</span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-[#132C17] rounded-full h-2.5 p-0.5 mt-3">
        <div
          className="h-full rounded-full bg-[#E5855E] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>

      {/* Status message */}
      <div className="mt-3 flex items-center justify-between text-xs text-emerald-100">
        {isGoalReached ? (
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Check className="w-3.5 h-3.5" />
            Target tercapai, siap berangkat
          </span>
        ) : (
          <span>
            Kurang <strong className="font-tabular font-semibold text-[#FFBE98]">{formatIDR(remainingAmount)}</strong> lagi
          </span>
        )}
        <span className="text-emerald-300/80 font-tabular">
          {memberCount > 0 ? `${memberCount} Peserta` : 'Peserta'}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[#294F2E]">
        <button
          onClick={onQuickPay}
          className="py-2.5 px-3 rounded-[10px] bg-[#D96B43] hover:bg-[#c65e38] active:bg-[#b0512d] text-white font-medium text-xs text-center cursor-pointer"
        >
          Setor Patungan
        </button>
        <button
          onClick={onQuickExpense}
          className="py-2.5 px-3 rounded-[10px] bg-[#294F2E] hover:bg-[#34653a] text-white font-medium text-xs text-center cursor-pointer"
        >
          Catat Nota Hari-H
        </button>
      </div>
    </div>
  );
};
