import React from 'react';
import { Tent, LogIn, ArrowRight } from 'lucide-react';

interface GoogleAuthGateProps {
  onSignIn: () => void;
}

export const GoogleAuthGate: React.FC<GoogleAuthGateProps> = ({ onSignIn }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-[#F4F6F4]">
      {/* Brand Header */}
      <div className="flex items-center gap-2 pt-2">
        <div className="w-8 h-8 rounded-lg bg-[#276738] text-white flex items-center justify-center font-bold">
          <Tent className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#172118] leading-none">otwbayar</h1>
          <p className="text-[10px] text-[#576458]">Satu langkah lagi untuk masuk trip</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF0E8] border border-[#D7E3D4] flex items-center justify-center mx-auto shadow-xs text-[#276738]">
          <LogIn className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#172118]">
            Verifikasi Akun Google Kamu
          </h2>
          <p className="text-xs text-[#576458] leading-relaxed max-w-xs mx-auto">
            Hubungkan link undangan dengan akun Google agar kamu bisa langsung buka trip kapan saja tanpa perlu cari link token lagi.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8DF] shadow-xs text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#172118]">
            <span className="w-2 h-2 rounded-full bg-[#276738]" />
            Akses Otomatis Tersimpan
          </div>
          <p className="text-[11px] text-[#576458] leading-normal">
            Setelah login, akun Google kamu terhubung ke identitas anggota di trip ini secara permanen.
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <div className="space-y-3 pb-2">
        <button
          onClick={onSignIn}
          className="w-full py-3 px-4 rounded-[12px] bg-[#172118] hover:bg-[#233125] active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-all"
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
          <span>Lanjut dengan Google</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-center text-[10px] text-[#718073]">
          otwbayar &bull; Hanya membaca profil & email Google dasar
        </p>
      </div>
    </div>
  );
};
