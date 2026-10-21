import React, { useState } from 'react';
import { PaymentProof, Group } from '@/types';
import { formatIDR, timeAgo } from '@/lib/format';
import { ShieldCheck, Check, X, ExternalLink } from 'lucide-react';

interface CoordinatorReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  proofs: PaymentProof[];
  coordinatorToken: string;
  onReviewed: () => void;
}

export const CoordinatorReviewModal: React.FC<CoordinatorReviewModalProps> = ({
  isOpen,
  onClose,
  group,
  proofs,
  coordinatorToken,
  onReviewed,
}) => {
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen) return null;

  const pendingProofs = proofs.filter((p) => p.status === 'PENDING');

  const handleAction = async (proofId: string, action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          proofId,
          action,
          reviewerToken: coordinatorToken,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        setSelectedProof(null);
        setShowRejectInput(false);
        setRejectionReason('');
        onReviewed();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal memproses verifikasi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#245229]" />
              Verifikasi Bukti Setoran ({pendingProofs.length})
            </h2>
            <p className="text-xs text-[#576458]">Persetujuan bendahara trip</p>
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
          {pendingProofs.length === 0 ? (
            <div className="text-center py-8 text-stone-500 space-y-2">
              <Check className="w-10 h-10 text-emerald-600 mx-auto bg-emerald-50 p-2 rounded-full" />
              <p className="text-xs font-semibold text-[#182315]">Semua Bukti Sudah Diverifikasi!</p>
              <p className="text-[11px]">Belum ada antrean setoran baru dari peserta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProofs.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#182315]">{p.member_name}</div>
                      <div className="text-base font-tabular font-extrabold text-[#143518]">
                        {formatIDR(p.amount)}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {timeAgo(p.submitted_at)} {p.note && `• "${p.note}"`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProof(selectedProof?.id === p.id ? null : p)}
                      className="text-xs text-emerald-800 font-semibold underline flex items-center gap-1 cursor-pointer"
                    >
                      Lihat Foto Resi
                    </button>
                  </div>

                  {/* Resi preview */}
                  {selectedProof?.id === p.id && (
                    <div className="p-2 bg-white rounded-xl border border-stone-200 space-y-2">
                      <div className="max-h-64 overflow-hidden rounded-lg bg-stone-900 flex items-center justify-center">
                        <img
                          src={p.proof_image_url}
                          alt="Resi Transfer"
                          className="max-h-64 object-contain w-full"
                        />
                      </div>
                      <a
                        href={p.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-800 flex items-center justify-center gap-1 font-semibold"
                      >
                        Buka Foto Ukuran Penuh <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Reject reason input */}
                  {showRejectInput && selectedProof?.id === p.id && (
                    <div className="space-y-1.5 pt-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Alasan penolakan (misal: nominal tidak cocok)"
                        className="w-full p-2 text-xs border border-rose-300 rounded-lg outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => handleAction(p.id, 'APPROVE')}
                      disabled={isProcessing}
                      className="py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Terima Setoran
                    </button>

                    {showRejectInput && selectedProof?.id === p.id ? (
                      <button
                        onClick={() => handleAction(p.id, 'REJECT')}
                        disabled={isProcessing}
                        className="py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        Konfirmasi Tolak
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedProof(p);
                          setShowRejectInput(true);
                        }}
                        disabled={isProcessing}
                        className="py-2 px-3 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600" />
                        Tolak
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
