/**
 * Format integer IDR to Rupiah string cleanly without floating point inaccuracies
 * Example: 800000 -> "Rp 800.000"
 */
export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Calculate countdown days from today to trip_date
 */
export function getDaysRemaining(tripDateStr: string): number {
  const tripDate = new Date(tripDateStr);
  const now = new Date();
  // Reset time portions for accurate day differences
  tripDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = tripDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format countdown days or finished state for trips
 */
export function formatTripDays(daysLeft: number): string {
  if (daysLeft < 0) return 'Selesai';
  if (daysLeft === 0) return 'Hari H';
  return `${daysLeft} Hari Lagi`;
}

/**
 * Get human readable status badge for member contribution
 */
export function getMemberStatus(paid: number, quota: number, hasPending: boolean = false) {
  if (hasPending) {
    return {
      label: 'Menunggu Cek',
      variant: 'pending' as const,
      color: 'bg-[#FFF8E6] text-[#8F4A00] border-[#FFE0B2]',
      pill: 'bg-[#8F4A00]',
    };
  }
  if (paid >= quota && quota > 0) {
    return {
      label: 'Siap Berangkat',
      variant: 'completed' as const,
      color: 'bg-[#EEF6ED] text-[#143518] border-[#C2DEC0]',
      pill: 'bg-[#276738]',
    };
  }
  if (paid > 0) {
    const percent = Math.round((paid / quota) * 100);
    return {
      label: `Cicilan ${percent}%`,
      variant: 'partial' as const,
      color: 'bg-[#F2F8FD] text-[#0A3A80] border-[#D0E4FA]',
      pill: 'bg-[#1D5FD6]',
    };
  }
  return {
    label: 'Belum Setor',
    variant: 'unpaid' as const,
    color: 'bg-[#F4F6F4] text-[#576458] border-[#D7DED3]',
    pill: 'bg-[#576458]',
  };
}

/**
 * Relative time formatter (e.g., '2 jam yang lalu')
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
