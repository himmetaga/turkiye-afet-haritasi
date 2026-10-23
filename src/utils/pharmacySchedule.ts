import { EmergencyFacility } from '../types';

export interface PharmacyStatusResult {
  isOpen: boolean;
  statusText: string;
  badgeClass: string;
  isDuty: boolean;
  remainingText?: string;
}

export function isAfterClosingHours(refDate = new Date()): boolean {
  // Convert to Turkey local time (UTC+3)
  const turkeyTimeStr = refDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
  const local = new Date(turkeyTimeStr);
  const day = local.getDay(); // 0: Sunday, 6: Saturday
  const hours = local.getHours();
  const minutes = local.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Sunday is closed all day for regular daytime pharmacies
  if (day === 0) return true;

  // Standard weekday/saturday closing is 19:00, opening at 08:30
  return currentMinutes < 8 * 60 + 30 || currentMinutes >= 19 * 60;
}

export function evaluatePharmacyStatus(
  facility: EmergencyFacility,
  refDate = new Date()
): PharmacyStatusResult {
  if (facility.category !== 'pharmacy') {
    return {
      isOpen: true,
      statusText: '7/24 Kesintisiz Hizmet',
      badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      isDuty: false
    };
  }

  // Duty pharmacy: 24/7 Open
  if (facility.isDuty) {
    return {
      isOpen: true,
      statusText: '24 Saat Nöbetçi (Açık)',
      badgeClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      isDuty: true
    };
  }

  // Turkey Time (Europe/Istanbul)
  const turkeyTimeStr = refDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
  const local = new Date(turkeyTimeStr);
  const day = local.getDay();
  const hours = local.getHours();
  const minutes = local.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Sunday: Closed all day
  if (day === 0) {
    return {
      isOpen: false,
      statusText: 'Kapalı (Pazar • Nöbetçi Eczaneye Gidiniz)',
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      isDuty: false
    };
  }

  // Weekdays (Monday-Friday) and Saturday: 08:30 - 19:00
  const openMinutes = 8 * 60 + 30; // 08:30
  const closeMinutes = 19 * 60;    // 19:00

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const diff = closeMinutes - currentMinutes;
    const diffHours = Math.floor(diff / 60);
    const diffMins = diff % 60;
    const rem = diffHours > 0 ? `${diffHours} sa ${diffMins} dk sonra kapanır` : `${diffMins} dk sonra kapanır`;

    return {
      isOpen: true,
      statusText: `Açık (19:00 Kapanış • ${rem})`,
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      isDuty: false,
      remainingText: rem
    };
  }

  return {
    isOpen: false,
    statusText: 'Kapalı (19:00 Sonrası • Yalnızca Nöbetçiler Hizmet Verir)',
    badgeClass: 'text-gray-400 bg-white/5 border-white/10',
    isDuty: false
  };
}

export function filterPharmaciesBySchedule(
  facilities: EmergencyFacility[],
  onlyOpenDuty = true,
  refDate = new Date()
): EmergencyFacility[] {
  const afterHours = isAfterClosingHours(refDate);

  return facilities.filter((f) => {
    if (f.category !== 'pharmacy') return true;

    // Duty pharmacies are always shown
    if (f.isDuty) return true;

    // If after 19:00 or Sunday, only duty pharmacies should appear
    if (onlyOpenDuty || afterHours) {
      return false;
    }

    return true;
  });
}
