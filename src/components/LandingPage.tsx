'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tent, Users, ShieldCheck, Receipt, ArrowRight, Sparkles, KeyRound, Plus, AlertCircle } from 'lucide-react';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { TripSelectorModal, UserTripItem } from '@/components/TripSelectorModal';
import { signIn, useSession } from 'next-auth/react';

export const LandingPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const { data: session } = useSession();
  const [tokenInput, setTokenInput] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [userTrips, setUserTrips] = useState<UserTripItem[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);

  React.useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/trips')
        .then((res) => (res.ok ? res.json() : { trips: [] }))
        .then((data) => {
          if (data.trips && Array.isArray(data.trips)) {
            setUserTrips(data.trips);
          }
        })
        .catch((err) => console.warn(err));
    }
  }, [session?.user?.email]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      alert('Masukkan Token akses trip kamu');
      return;
    }
    router.push(`/?token=${encodeURIComponent(tokenInput.trim())}`);
  };

  const handleGroupCreated = (newGroupId: string, coordToken: string) => {
    router.push(`/?token=${encodeURIComponent(coordToken)}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-[#F4F6F0]">
      {/* Brand Header */}
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1E3F20] text-amber-300 flex items-center justify-center shadow-xs">
            <Tent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[#182315] leading-none">
              otwbayar
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">Patungan & split bill squad santai</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#D96B43] hover:bg-[#C65E38] text-white text-xs font-semibold cursor-pointer shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Trip Baru</span>
        </button>
      </header>

      {/* Hero Section */}
      <section className="py-6 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Khusus Member & Bendahara Terdaftar
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#182315] leading-tight tracking-tight">
          Transparansi dana liburan tanpa drama grup chat.
        </h2>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          otwbayar menggunakan sistem akses invite link khusus per trip. Masukkan token trip kamu atau buat trip baru bersama squad.
        </p>

        {/* Feature Pills */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E3E8DC] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#182315]">Pantau Iuran Real-Time</p>
              <p className="text-[11px] text-stone-500">Anggota hanya bisa memantau progres tanpa akses edit/share link.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E3E8DC] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#182315]">Kontrol Penuh Bendahara</p>
              <p className="text-[11px] text-stone-500">Hanya bendahara yang berhak membagikan link squad & verifikasi transfer.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#E3E8DC] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#182315]">Split Bill & Settlement</p>
              <p className="text-[11px] text-stone-500">Catat nota belanja lapangan dan rekap otomatis siapa ganti ke siapa.</p>
            </div>
          </div>
        </div>

        {/* Google Sign In option */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E3E8DC] shadow-xs">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold text-[#182315]">
              {session?.user ? `Masuk sebagai ${session.user.name || session.user.email}` : 'Masuk dengan Akun Google'}
            </p>

            {authError && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] text-left flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">OAuth Belum Dikonfigurasi</p>
                  <p className="text-[10px] text-amber-800">
                    Isi <code>GOOGLE_CLIENT_ID</code> dan <code>GOOGLE_CLIENT_SECRET</code> di <code>.env.local</code> untuk mengaktifkan login Google.
                  </p>
            {session?.user && (
              <div className="pt-2 border-t border-stone-200">
                {userTrips.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowTripSelector(true)}
                    className="w-full py-2.5 px-3 bg-[#245229] hover:bg-[#1C3B20] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <Tent className="w-4 h-4 text-emerald-300" />
                    <span>Pilih dari {userTrips.length} Trip Kamu</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-stone-500">
                    Belum ada trip terdaftar dengan email {session.user.email}. Masukkan token atau buat trip baru di bawah.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
            )}

            {!session?.user && (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="w-full py-2.5 px-3 bg-white border border-stone-300 hover:bg-stone-50 text-[#182315] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Masuk lewat Google
              </button>
            )}
          </div>
        </div>

        {/* Access Token Form */}
        <form onSubmit={handleJoin} className="bg-white p-3.5 rounded-2xl border border-[#E3E8DC] shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#182315]">
            <KeyRound className="w-3.5 h-3.5 text-emerald-800" />
            Masuk ke Trip yang Sudah Ada
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Masukkan Token Akses kamu (contoh: mem_xxx / coord_xxx)"
              className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="submit"
              disabled={!tokenInput.trim()}
              className="w-full py-2.5 rounded-xl bg-[#1E3F20] hover:bg-[#2D5A27] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              <span>Buka Trip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer className="space-y-2.5 pt-2 pb-2">
        <button
          onClick={() => setShowCreateGroup(true)}
          className="w-full py-3 rounded-xl bg-[#D96B43] hover:bg-[#C65E38] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Perencanaan Trip Baru</span>
        </button>
        <p className="text-center text-[10px] text-stone-400">
          Zero password login &bull; Akses aman melalui token URL trip
        </p>
      </footer>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={handleGroupCreated}
      />

      {/* Trip Selector Modal */}
      <TripSelectorModal
        isOpen={showTripSelector}
        onClose={() => setShowTripSelector(false)}
        trips={userTrips}
        onSelectTrip={(t) => {
          localStorage.setItem('otw_trip_token', t.token);
          localStorage.setItem('otw_trip_group_id', t.groupId);
          router.push(`/?token=${t.token}`);
        }}
        onCreateNewTrip={() => setShowCreateGroup(true)}
      />
    </div>
  );
};

