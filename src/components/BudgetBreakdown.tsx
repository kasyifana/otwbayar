import React, { useState } from 'react';
import { BudgetCategory } from '@/types';
import { formatIDR } from '@/lib/format';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface BudgetBreakdownProps {
  categories: BudgetCategory[];
  totalTarget: number;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({
  categories,
  totalTarget,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-[20px] p-4 border border-[#E2E8DF] space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-[#172118]">
          Breakdown Pos Anggaran
        </h2>
        <span className="text-xs font-tabular font-semibold text-[#576458]">
          Total: {formatIDR(totalTarget)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {categories.map((cat) => {
          const percent = totalTarget > 0 ? Math.round((cat.allocated_amount / totalTarget) * 100) : 0;
          const isExpanded = expandedId === cat.id;

          return (
            <div
              key={cat.id}
              className="border border-[#E2E8DF] rounded-[12px] overflow-hidden bg-[#F9FAF8]"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold text-[#172118] truncate">
                    {cat.name}
                  </div>
                  <div className="text-[11px] text-[#576458] font-tabular mt-0.5">
                    {formatIDR(cat.allocated_amount)} ({percent}%)
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-tabular font-semibold bg-white border border-[#D7DED3] px-1.5 py-0.5 rounded-[4px] text-[#172118]">
                    {percent}%
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#576458]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#576458]" />
                  )}
                </div>
              </div>

              {/* Progress per pos */}
              <div className="px-3 pb-2.5">
                <div className="w-full bg-[#E2E8DF] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#245229] h-full rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-3 py-2.5 bg-white border-t border-[#E2E8DF] text-xs text-[#576458] space-y-1">
                  <div className="flex justify-between">
                    <span>Realisasi terpakai:</span>
                    <span className="font-tabular font-semibold text-[#172118]">
                      {formatIDR(cat.spent_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa anggaran pos:</span>
                    <span className="font-tabular text-[#276738] font-semibold">
                      {formatIDR(Math.max(0, cat.allocated_amount - (cat.spent_amount || 0)))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
