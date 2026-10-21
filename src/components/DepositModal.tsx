import React, { useState } from 'react';
import { Group, Member } from '@/types';
import { formatIDR } from '@/lib/format';
import { QrCode, Upload, Check, Copy, X } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  members: Member[];
  currentMember: Member | null;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  group,
  members,
  currentMember,
  onSuccess,
}) => {
  // Lock member selection to authenticated user if not coordinator
  const isLockedMember = Boolean(currentMember);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    currentMember?.id || (members[0]?.id ?? '')
  );
  const [amount, setAmount] = useState<number>(400000);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const quickAmounts = [200000, 400000, 800000];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert('Pilih member terlebih dahulu');
      return;
    }
    if (amount <= 0) {
      alert('Nominal harus lebih dari Rp 0');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = previewUrl;

      // If user uploaded a new file, upload via /api/upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('prefix', 'proof');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          finalImageUrl = uploadData.url;
        }
      }

      // Submit payment proof
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          memberId: selectedMemberId,
          amount,
          proofImageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
          note,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Gagal mengirim bukti setor');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankDetails = group.bank_account_details || 'BCA 8040192831 a/n Sarah Bendahara';

  const copyBank = () => {
    navigator.clipboard.writeText(bankDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#245229]" />
              Setor Tabungan Glamping
            </h2>
            <p className="text-xs text-[#576458]">Scan QRIS & kirim bukti transfer</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#F4F6F4] flex items-center justify-center text-[#576458] hover:bg-[#EAEFE8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* QRIS Card */}
          <div className="p-4 bg-[#F4F6F4] rounded-[16px] border border-[#E2E8DF] text-center space-y-3">
            <span className="text-[11px] font-medium text-[#245229] bg-[#E3EDE3] px-2.5 py-0.5 rounded-[6px] inline-block">
              QRIS Statis Bendahara
            </span>

            <div className="w-56 h-56 mx-auto bg-white p-2 rounded-[16px] border border-[#E2E8DF] shadow-xs flex items-center justify-center overflow-hidden">
              <img
                src={group.qris_image_url}
                alt="QRIS Barcode"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            <div className="text-xs text-[#576458] space-y-1">
              <p className="font-medium text-[#172118]">{bankDetails}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyBank}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#245229] bg-white border border-[#D7DED3] px-2 py-1 rounded-[8px] hover:bg-[#F9FAF8] cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#276738]" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Tersalin' : 'Salin Rekening'}
                </button>
              </div>
            </div>
          </div>

          {/* Member Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Penyetor Atas Nama
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              disabled={isLockedMember}
              className={`w-full p-2.5 text-xs rounded-[10px] outline-none font-tabular ${
                isLockedMember
                  ? 'bg-stone-100 text-stone-600 border border-stone-200 cursor-not-allowed'
                  : 'bg-[#F9FAF8] border border-[#D7DED3] focus:border-[#245229]'
              }`}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Sudah setor: {formatIDR(m.paid_amount)})
                </option>
              ))}
            </select>
            {isLockedMember && (
              <p className="text-[10px] text-stone-500 mt-1">
                Terkunci otomatis sesuai link undangan akunmu.
              </p>
            )}
          </div>

          {/* Amount presets & input */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Nominal Setoran (IDR)
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className={`py-1.5 text-xs font-tabular rounded-[8px] border cursor-pointer ${
                    amount === q
                      ? 'bg-[#245229] text-white border-[#245229] font-semibold'
                      : 'bg-[#F9FAF8] border-[#E2E8DF] text-[#172118] hover:bg-[#EEF2EB]'
                  }`}
                >
                  {formatIDR(q)}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Contoh: 400000"
              className="w-full p-2.5 text-sm font-tabular font-bold bg-[#F9FAF8] border border-[#D7DED3] rounded-[10px] focus:border-[#245229] outline-none"
              required
            />
          </div>

          {/* Proof Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Bukti Transfer / Resi
            </label>
            <div className="relative border border-dashed border-[#CCD4C7] rounded-[16px] p-4 text-center hover:border-[#245229] bg-[#F9FAF8]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Preview Struk"
                    className="w-14 h-14 object-cover rounded-[8px] border border-[#D7DED3]"
                  />
                  <div className="text-left text-xs truncate">
                    <p className="font-semibold text-[#245229]">Foto terpilih</p>
                    <p className="text-[11px] text-[#576458]">Klik untuk ganti gambar</p>
                  </div>
                </div>
              ) : (
                <div className="py-2 space-y-1">
                  <Upload className="w-5 h-5 text-[#576458] mx-auto" />
                  <p className="text-xs font-medium text-[#172118]">
                    Upload bukti transfer
                  </p>
                  <p className="text-[10px] text-[#576458]">JPG, PNG, atau WebP</p>
                </div>
              )}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Catatan Singkat (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: Cicilan ke-1"
              className="w-full p-2.5 text-xs bg-[#F9FAF8] border border-[#D7DED3] rounded-[10px] focus:border-[#245229] outline-none"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-[10px] bg-[#245229] hover:bg-[#1C3B20] text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Bukti untuk Diverifikasi'}
          </button>
        </form>
      </div>
    </div>
  );
};
