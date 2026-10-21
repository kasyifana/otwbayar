import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, Tent, X } from 'lucide-react';
import { formatIDR } from '@/lib/format';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (groupId: string, coordinatorToken: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [tripDate, setTripDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [coordinatorName, setCoordinatorName] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberInput, setNewMemberInput] = useState('');

  const [categories, setCategories] = useState([
    { name: 'Sewa Tenda Safari Glamping', amount: 2800000 },
    { name: 'Paket BBQ & Bahan Makanan', amount: 1400000 },
    { name: 'Transportasi & Bensin', amount: 1050000 },
    { name: 'Dana Darurat & Snack', amount: 350000 },
  ]);

  const [qrisUrl, setQrisUrl] = useState(
    'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalBudget = categories.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPeople = (coordinatorName.trim() ? 1 : 0) + members.length;
  const quotaPerPerson = totalPeople > 0 ? Math.round(totalBudget / totalPeople) : 0;

  const handleAddMember = () => {
    if (newMemberInput.trim() && members.length < 12) {
      setMembers([...members, newMemberInput.trim()]);
      setNewMemberInput('');
    }
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleCategoryChange = (idx: number, field: 'name' | 'amount', val: string | number) => {
    const updated = [...categories];
    updated[idx] = { ...updated[idx], [field]: val };
    setCategories(updated);
  };

  const handleAddCategory = () => {
    setCategories([...categories, { name: 'Pos Baru', amount: 200000 }]);
  };

  const handleRemoveCategory = (idx: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Isi nama grup trip glamping');
    if (!coordinatorName.trim()) return alert('Isi nama kamu sebagai bendahara/koordinator');

    setIsSubmitting(true);
    try {
      const allMembers = [coordinatorName.trim(), ...members];
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          trip_date: tripDate,
          members: allMembers,
          coordinatorEmail: session?.user?.email || null,
          categories,
          qris_image_url: qrisUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onCreated(data.group.id, data.coordinator_token);
        onClose();
      } else {
        alert(data.error || 'Gagal membuat grup');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-[#E2E8DF] flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-semibold text-[#172118] flex items-center gap-1.5">
              <Tent className="w-4 h-4 text-[#245229]" />
              Inisiasi Glamping Baru
            </h2>
            <p className="text-xs text-[#576458]">Buat target patungan & undang teman</p>
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
          <div>
            <label className="block text-xs font-semibold text-[#182315] mb-1">
              Nama Rencana Glamping
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Glamping Riverside Pangalengan"
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#182315] mb-1">
                Lokasi Glamping
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lokasi glamping..."
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#182315] mb-1">
                Tanggal Trip
              </label>
              <input
                type="date"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182315] mb-1">
              Nama Kamu (Bendahara/Trip Lead)
            </label>
            <input
              type="text"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              placeholder="Contoh: Sarah"
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
              required
            />
          </div>

          {/* Members list */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#182315]">
                Daftar Teman Ikut ({totalPeople} Orang)
              </label>
            </div>
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={newMemberInput}
                onChange={(e) => setNewMemberInput(e.target.value)}
                placeholder="Tambah nama teman..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                className="flex-1 p-2 text-xs bg-stone-50 border border-stone-300 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-3 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold"
              >
                +
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {coordinatorName && (
                <span className="text-[11px] font-semibold bg-[#E3EDE3] text-[#143518] border border-[#C2DEC0] px-2 py-0.5 rounded-full">
                  {coordinatorName} (Lead)
                </span>
              )}
              {members.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[11px] bg-stone-100 text-stone-800 border border-stone-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {m}
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Budget Categories breakdown */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#182315]">
                Rincian Pos Biaya (Total: {formatIDR(totalBudget)})
              </label>
              <button
                type="button"
                onClick={handleAddCategory}
                className="text-[11px] text-emerald-800 font-semibold"
              >
                + Tambah Pos
              </button>
            </div>

            <div className="space-y-1.5">
              {categories.map((c, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleCategoryChange(i, 'name', e.target.value)}
                    className="flex-1 p-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    value={c.amount || ''}
                    onChange={(e) => handleCategoryChange(i, 'amount', Number(e.target.value))}
                    className="w-28 p-1.5 text-xs font-tabular bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(i)}
                      className="p-1 text-stone-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {totalPeople > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-tabular">
                Target per orang: <strong>{formatIDR(quotaPerPerson)}</strong> ({totalPeople} orang)
              </div>
            )}
          </div>

          {/* Static QRIS Image URL */}
          <div>
            <label className="block text-xs font-semibold text-[#182315] mb-1">
              Link Gambar QRIS Statis Kamu
            </label>
            <input
              type="text"
              value={qrisUrl}
              onChange={(e) => setQrisUrl(e.target.value)}
              className="w-full p-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-[#1E3F20] hover:bg-[#2D5A27] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Membuat Trip...' : 'Simpan & Dapatkan Magic Link'}
          </button>
        </form>
      </div>
    </div>
  );
};
