import React, { useState } from 'react';
import { Group, Member, BudgetCategory } from '@/types';
import { formatIDR } from '@/lib/format';
import { Receipt, X, ScanText, Loader2, Users, User, Check } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  members: Member[];
  categories: BudgetCategory[];
  currentMember: Member | null;
  onSuccess: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  group,
  members,
  categories,
  currentMember,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [paidByMemberId, setPaidByMemberId] = useState<string>(
    currentMember?.id || (members[0]?.id ?? '')
  );
  const [categoryId, setCategoryId] = useState<string>(categories[3]?.id || categories[0]?.id || '');
  const [source, setSource] = useState<'POOL_FUND' | 'MEMBER_REIMBURSE'>('MEMBER_REIMBURSE');
  const [splitType, setSplitType] = useState<'ALL' | 'ASSIGNED'>('ALL');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>(members.map((m) => m.id));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // OCR state
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>('');

  if (!isOpen) return null;

  const toggleMemberAssignment = (memberId: string) => {
    if (assignedMemberIds.includes(memberId)) {
      if (assignedMemberIds.length > 1) {
        setAssignedMemberIds(assignedMemberIds.filter((id) => id !== memberId));
      }
    } else {
      setAssignedMemberIds([...assignedMemberIds, memberId]);
    }
  };

  const handleScanOCR = async (file: File) => {
    setIsScanningOCR(true);
    setOcrProgress('Menyiapkan scanner...');
    try {
      const worker = await createWorker('ind+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(`Membaca struk ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Simple regex extraction for total amount
      // Patterns: Total, Rp, Tagihan, Jumlah, etc.
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      
      // Look for total keywords
      let detectedAmount = 0;
      let detectedTitle = '';

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].toLowerCase();
        if (line.includes('total') || line.includes('grand') || line.includes('jumlah') || line.includes('bayar') || line.includes('rp')) {
          const numbers = lines[i].replace(/[^0-9]/g, '');
          const parsed = parseInt(numbers, 10);
          if (parsed && parsed > 1000 && parsed < 100000000) {
            detectedAmount = parsed;
            break;
          }
        }
      }

      // If no total keyword match, search largest reasonable number
      if (!detectedAmount) {
        const allNums = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/g) || [];
        const cleanNums = allNums
          .map((n) => parseInt(n.replace(/[^0-9]/g, ''), 10))
          .filter((n) => n >= 2000 && n <= 50000000);
        if (cleanNums.length > 0) {
          detectedAmount = Math.max(...cleanNums);
        }
      }

      // Detect title from first non-empty lines (merchant name)
      if (lines.length > 0) {
        detectedTitle = lines[0].slice(0, 40);
      }

      if (detectedAmount > 0) {
        setAmount(detectedAmount);
      }
      if (detectedTitle && !title) {
        setTitle(detectedTitle);
      }
    } catch (err) {
      console.warn('OCR scan error:', err);
    } finally {
      setIsScanningOCR(false);
      setOcrProgress('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Auto trigger OCR on receipt upload
      handleScanOCR(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Tulis nama pengeluaran');
      return;
    }
    if (amount <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = previewUrl;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('prefix', 'receipt');
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          finalImageUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: group.id,
          paidByMemberId: source === 'MEMBER_REIMBURSE' ? paidByMemberId : null,
          categoryId,
          title,
          amount,
          receiptImageUrl: finalImageUrl || null,
          source,
          splitType,
          assignedMemberIds: splitType === 'ASSIGNED' ? assignedMemberIds : members.map((m) => m.id),
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyimpan pengeluaran');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSplitCount = splitType === 'ALL' ? members.length : assignedMemberIds.length;
  const splitPerPerson = Math.round(amount / Math.max(1, activeSplitCount));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-[#245229]" />
              Catat Nota Belanja Hari-H
            </h2>
            <p className="text-xs text-[#576458]">Scan OCR struk & atur pembagian per orang</p>
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
          {/* Receipt Photo with OCR Auto-Scan */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5 flex items-center justify-between">
              <span>Foto Struk / Nota (Auto-Scan OCR)</span>
              {isScanningOCR && (
                <span className="text-[11px] text-[#D96B43] flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {ocrProgress || 'Scanning...'}
                </span>
              )}
            </label>
            <div className="relative border-2 border-dashed border-[#D7DED3] rounded-2xl p-3 text-center bg-[#F9FAF8] hover:border-[#245229] transition-colors">
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
                    alt="Struk"
                    className="w-14 h-14 object-cover rounded-xl border border-[#D7DED3]"
                  />
                  <div className="text-left text-xs">
                    <p className="font-semibold text-[#245229] flex items-center gap-1">
                      <ScanText className="w-3.5 h-3.5" />
                      Foto Terpilih & Ter-scan
                    </p>
                    <p className="text-[11px] text-[#576458]">Sentuh untuk ganti foto struk</p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <ScanText className="w-6 h-6 text-[#576458] mx-auto mb-1" />
                  <p className="text-xs font-medium text-[#172118]">
                    Ambil foto / Upload Struk Belanja
                  </p>
                  <p className="text-[10px] text-[#576458]">
                    Sistem otomatis membaca total nominal & nama toko (OCR)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Nama Pengeluaran / Toko
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Arang BBQ & Es Kristal di Indomaret"
              className="w-full p-2.5 text-xs bg-[#F9FAF8] border border-[#D7DED3] rounded-[10px] focus:border-[#245229] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Total Nominal Nota (IDR)
            </label>
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2.5 text-sm font-tabular font-bold bg-[#F9FAF8] border border-[#D7DED3] rounded-[10px] focus:border-[#245229] outline-none"
              required
            />
            {amount > 0 && (
              <p className="text-[11px] text-[#576458] mt-1 font-tabular">
                Beban patungan: <span className="font-semibold text-[#245229]">{formatIDR(splitPerPerson)}</span> / {activeSplitCount} orang
              </p>
            )}
          </div>

          {/* Allocation: Split to All or Assign Specific People */}
          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Pilihan Pembagian Bill
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSplitType('ALL')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  splitType === 'ALL'
                    ? 'bg-[#EEF6ED] border-[#245229] text-[#143518] font-bold shadow-xs'
                    : 'bg-[#F9FAF8] border-[#E2E8DF] text-[#172118]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#245229]" />
                  <span>Satu Grup Rata</span>
                </div>
                <div className="text-[10px] text-[#576458] font-normal mt-0.5">
                  Bagi ke semua {members.length} peserta
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitType('ASSIGNED')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  splitType === 'ASSIGNED'
                    ? 'bg-[#EEF6ED] border-[#245229] text-[#143518] font-bold shadow-xs'
                    : 'bg-[#F9FAF8] border-[#E2E8DF] text-[#172118]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D96B43]" />
                  <span>Pilih Orang Tertentu</span>
                </div>
                <div className="text-[10px] text-[#576458] font-normal mt-0.5">
                  Hanya yang ikut konsumsi
                </div>
              </button>
            </div>

            {/* If assigned, show member chips */}
            {splitType === 'ASSIGNED' && (
              <div className="p-3 bg-[#F4F6F4] rounded-2xl border border-[#D7DED3] space-y-1.5">
                <span className="text-[11px] font-semibold text-[#172118] block">
                  Pilih siapa saja yang ikut nanggung bill ini:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const isSelected = assignedMemberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMemberAssignment(m.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C3B20] text-white shadow-xs'
                            : 'bg-white text-[#576458] border border-[#D7DED3]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172118] mb-1.5">
              Sumber Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSource('MEMBER_REIMBURSE')}
                className={`p-2.5 rounded-[10px] border text-left text-xs cursor-pointer ${
                  source === 'MEMBER_REIMBURSE'
                    ? 'bg-[#EEF6ED] border-[#245229] text-[#143518] font-semibold'
                    : 'bg-[#F9FAF8] border-[#E2E8DF] text-[#172118]'
                }`}
              >
                <div>Ditalangi Member</div>
                <div className="text-[10px] text-[#576458]">Perlu direimburse</div>
              </button>
              <button
                type="button"
                onClick={() => setSource('POOL_FUND')}
                className={`p-2.5 rounded-[10px] border text-left text-xs cursor-pointer ${
                  source === 'POOL_FUND'
                    ? 'bg-[#EEF6ED] border-[#245229] text-[#143518] font-semibold'
                    : 'bg-[#F9FAF8] border-[#E2E8DF] text-[#172118]'
                }`}
              >
                <div>Dari Kas Bersama</div>
                <div className="text-[10px] text-[#576458]">Potong pool kas</div>
              </button>
            </div>
          </div>

          {source === 'MEMBER_REIMBURSE' && (
            <div>
              <label className="block text-xs font-semibold text-[#182315] mb-1.5">
                Siapa yang Nalanin Dulu?
              </label>
              <select
                value={paidByMemberId}
                onChange={(e) => setPaidByMemberId(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182315] mb-1.5">
              Alokasi Pos Biaya
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#1E3F20] hover:bg-[#2D5A27] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              'Simpan Pengeluaran'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
