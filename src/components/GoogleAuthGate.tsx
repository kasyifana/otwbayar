import React from 'react';
import { Tent, LogIn, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface GoogleAuthGateProps {
  onSignIn: () => void;
}

export const GoogleAuthGate: React.FC<GoogleAuthGateProps> = ({ onSignIn }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 bg-[#F4F6F4]">
      {/* Brand Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1C3B20] text-emerald-200 flex items-center justify-center font-bold shadow-xs">
            <Tent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#172118] leading-none">otwbayar</h1>
            <p className="text-[10px] text-[#576458] mt-0.5">Satu langkah lagi untuk masuk trip</p>
          </div>
        </div>
      </div>

      {/* Hero Visual & Copy */}
      <div className="py-6 space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF0E8] border border-[#D7E3D4] flex items-center justify-center mx-auto shadow-xs text-[#245229]">
          <LogIn className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#172118] tracking-tight">
            Verifikasi Akun Google
          </h2>
          <p className="text-xs text-[#576458] leading-relaxed max-w-xs mx-auto">
            Hubungkan akun Google agar kamu bisa membuka trip kapan saja tanpa perlu mencari link token lagi.
          </p>
        </div>

        {/* Feature Points */}
        <div className="space-y-2 text-left pt-2">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8DF] shadow-xs flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172118]">Akses Otomatis Tersimpan</p>
              <p className="text-[11px] text-[#576458]">Trip langsung tersimpan di akun Google kamu.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-[#E2E8DF] shadow-xs flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#172118]">Aman & Transparan</p>
              <p className="text-[11px] text-[#576458]">Hanya membaca nama & email profil Google dasar.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="space-y-2.5 pb-2">
        <button
          onClick={onSignIn}
          className="w-full py-3 rounded-xl bg-[#1C3B20] hover:bg-[#142C18] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-all"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>Lanjut Masuk dengan Google</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>

        <p className="text-center text-[10px] text-[#718073]">
          otwbayar &bull; Tanpa ribet registrasi atau hafalkan password
        </p>
      </div>
    </div>
  );
};
