import React from 'react';
import { Tent } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-[16px] bg-[#1C3B20] text-emerald-200 flex items-center justify-center">
        <Tent className="w-8 h-8" />
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-lg font-bold tracking-tight text-[#172118]">
          otwbayar
        </h1>
        <p className="text-xs text-[#576458]">Memuat data patungan...</p>
      </div>

      {/* Mini Skeleton Card */}
      <div className="w-full max-w-xs p-4 rounded-[16px] bg-white border border-[#E2E8DF] space-y-2.5">
        <div className="h-3.5 bg-[#EEF2EB] rounded-[4px] w-1/2" />
        <div className="h-7 bg-[#EEF2EB] rounded-[6px] w-3/4" />
        <div className="h-2 bg-[#F4F6F4] rounded-full w-full" />
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8DF]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-[#EEF2EB]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-[#EEF2EB] rounded" />
            <div className="h-2.5 w-16 bg-[#F4F6F4] rounded" />
          </div>
        </div>
        <div className="h-7 w-16 bg-[#EEF2EB] rounded-[8px]" />
      </div>

      {/* Hero skeleton */}
      <div className="h-44 rounded-[20px] bg-[#EEF2EB]" />

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-[#E2E8DF] pb-2">
        <div className="h-5 w-28 bg-[#EEF2EB] rounded" />
        <div className="h-5 w-20 bg-[#F4F6F4] rounded" />
        <div className="h-5 w-20 bg-[#F4F6F4] rounded" />
      </div>

      {/* Member grid skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-[#EEF2EB] rounded" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-24 rounded-[12px] bg-white border border-[#E2E8DF]" />
          <div className="h-24 rounded-[12px] bg-white border border-[#E2E8DF]" />
          <div className="h-24 rounded-[12px] bg-white border border-[#E2E8DF]" />
          <div className="h-24 rounded-[12px] bg-white border border-[#E2E8DF]" />
        </div>
      </div>
    </div>
  );
};
