import React, { useState } from 'react';
import { Expense, Member, Group } from '@/types';
import { formatIDR, timeAgo } from '@/lib/format';
import { Plus, Copy, Check } from 'lucide-react';

interface ExpenseTabProps {
  group?: Group;
  expenses: Expense[];
  members: Member[];
  onOpenAddExpense: () => void;
}

export const ExpenseTab: React.FC<ExpenseTabProps> = ({
  group,
  expenses,
  members,
  onOpenAddExpense,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const memberReimburseTotal = expenses
    .filter((e) => e.source === 'MEMBER_REIMBURSE')
    .reduce((sum, e) => sum + e.amount, 0);

  // Settlement calculations taking into account assigned vs all splits
  const balances = members.map((member) => {
    const paidOutOfPocket = expenses
      .filter((e) => e.paid_by_member_id === member.id && e.source === 'MEMBER_REIMBURSE')
      .reduce((sum, e) => sum + e.amount, 0);

    // Sum member's fair share across all reimburse expenses
    const myShareOfExpenses = expenses
      .filter((e) => e.source === 'MEMBER_REIMBURSE')
      .reduce((sum, e) => {
        if (e.split_type === 'ASSIGNED' && e.assigned_member_ids && e.assigned_member_ids.length > 0) {
          if (e.assigned_member_ids.includes(member.id)) {
            return sum + Math.round(e.amount / e.assigned_member_ids.length);
          }
          return sum;
        }
        // Default to split to all members
        return sum + Math.round(e.amount / Math.max(1, members.length));
      }, 0);

    const balance = paidOutOfPocket - myShareOfExpenses;
    const unpaidQuota = Math.max(0, member.target_quota - member.paid_amount);
    return {
      member,
      paidOutOfPocket,
      myShareOfExpenses,
      balance,
      unpaidQuota,
    };
  });

  const handleCopySummary = () => {
    let text = `REKAP SETTLEMENT SPLIT BILL GLAMPING\n`;
    text += `Trip: ${group?.name || 'Glamping'}\n`;
    text += `Sisa Kas Bersama: ${formatIDR(group?.current_amount || 0)}\n`;
    text += `Total Talangan: ${formatIDR(memberReimburseTotal)}\n\n`;
    text += `Status Settlement:\n`;

    balances.forEach(({ member, paidOutOfPocket, balance, unpaidQuota }) => {
      let line = `• ${member.name}: `;
      if (balance > 0) {
        line += `Terima refund talangan ${formatIDR(balance)} (talangi ${formatIDR(paidOutOfPocket)})`;
      } else if (balance < 0) {
        line += `Bayar talangan ${formatIDR(Math.abs(balance))}`;
      } else {
        line += `Talangan Lunas (Rp 0)`;
      }
      if (unpaidQuota > 0) {
        line += ` [Sisa iuran pokok: ${formatIDR(unpaidQuota)}]`;
      }
      text += `${line}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top summary card */}
      <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E2E8DF] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#576458]">
              Total Nota Lapangan
            </span>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-[#172118] mt-0.5">
              {formatIDR(totalExpense)}
            </div>
            <p className="text-[11px] text-[#576458] font-tabular">
              {expenses.length} nota ({formatIDR(memberReimburseTotal)} ditalangi peserta)
            </p>
          </div>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-[10px] bg-[#245229] hover:bg-[#1C3B20] text-white text-xs font-medium cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Catat Nota
          </button>
        </div>
      </div>

      {/* Settlement / Split bill card */}
      {memberReimburseTotal > 0 && (
        <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E2E8DF] space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-[#172118]">
              Kalkulator Reimbursement Talangan
            </h3>
            <span className="text-[11px] font-tabular text-[#576458]">
              Berdasarkan alokasi perorangan/grup
            </span>
          </div>

          <div className="divide-y divide-[#EDF1EA]">
            {balances.map(({ member, paidOutOfPocket, balance, unpaidQuota }) => (
              <div key={member.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold text-white shrink-0"
                    style={{ backgroundColor: member.avatar_color }}
                  >
                    {member.name[0]}
                  </span>
                  <div>
                    <span className="font-semibold text-[#172118]">{member.name}</span>
                    <span className="text-[10px] sm:text-xs text-[#576458] block font-tabular">
                      Nalangi: {formatIDR(paidOutOfPocket)}
                      {unpaidQuota > 0 && (
                        <span className="text-[#8F4A00] ml-1 font-medium">
                          (Kurang iuran: {formatIDR(unpaidQuota)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right font-tabular">
                  {balance > 0 ? (
                    <span className="text-[#276738] font-semibold">
                      + Terima {formatIDR(balance)}
                    </span>
                  ) : balance < 0 ? (
                    <span className="text-[#B3261E] font-medium">
                      - Transfer {formatIDR(Math.abs(balance))}
                    </span>
                  ) : (
                    <span className="text-[#576458]">Lunas (Rp 0)</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#EDF1EA]">
            <button
              onClick={handleCopySummary}
              className="w-full py-2.5 px-3 rounded-[10px] bg-[#F4F6F4] border border-[#D7DED3] hover:bg-[#EAEFE8] text-[#172118] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-[#276738]" /> : <Copy className="w-3.5 h-3.5 text-[#576458]" />}
              {copiedSummary ? 'Rekapan Tersalin ke Clipboard' : 'Salin Rekap Settlement ke WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* Receipts list */}
      <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#E2E8DF] space-y-3">
        <h3 className="text-xs sm:text-sm font-semibold text-[#172118]">
          Daftar Nota Belanja Lapangan
        </h3>

        {expenses.length === 0 ? (
          <div className="text-center py-6 text-[#576458] text-xs">
            Belum ada nota belanja lapangan yang dicatat.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3 rounded-[12px] border border-[#E2E8DF] bg-[#F9FAF8] flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-[#172118]">{exp.title}</span>
                    {exp.split_type === 'ASSIGNED' ? (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full">
                        {exp.assigned_member_ids?.length || 0} Orang
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200 px-1.5 py-0.2 rounded-full">
                        Semua ({members.length})
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-tabular font-bold text-[#172118] mt-0.5">
                    {formatIDR(exp.amount)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#576458] mt-1 font-tabular">
                    {timeAgo(exp.created_at)} •{' '}
                    {exp.source === 'MEMBER_REIMBURSE'
                      ? `Ditalangi ${exp.paid_by_name}`
                      : 'Dari Kas Bersama'}
                  </div>
                </div>

                {exp.receipt_image_url && (
                  <button
                    onClick={() =>
                      setSelectedReceipt(
                        selectedReceipt === exp.receipt_image_url ? null : exp.receipt_image_url || null
                      )
                    }
                    className="flex-shrink-0 cursor-pointer"
                  >
                    <img
                      src={exp.receipt_image_url}
                      alt="Struk"
                      className="w-12 h-12 object-cover rounded-[8px] border border-[#D7DED3]"
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Struk fullscreen modal */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-sm max-h-[85vh] overflow-hidden rounded-[16px] bg-white p-2">
            <img
              src={selectedReceipt}
              alt="Foto Nota"
              className="max-h-[80vh] w-full object-contain rounded-[12px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
