import { antiManipulationService } from './antiManipulationService';

export interface FeltReport {
  id: string;
  intensity: number; // 1 to 10
  intensityRoman: string;
  intensityLabel: string;
  intensityColor: string;
  timestamp: number;
  timeString: string;
  city: string;
  district: string;
  coordinates: [number, number];
  buildingType: string;
  floor: number;
  comment?: string;
}

const STORAGE_KEY = 'afet_live_felt_reports_v1';
const CHANNEL_NAME = 'afet_live_felt_channel';

class FeltReportsService {
  private reports: FeltReport[] = [];
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(reports: FeltReport[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e) => {
          if (e.data && e.data.type === 'NEW_REPORT') {
            this.reports.unshift(e.data.report);
            this.notify();
          }
        };
      } catch {}
    }
  }

  public getReports(): FeltReport[] {
    return this.reports;
  }

  public subscribe(listener: (reports: FeltReport[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.reports);
    return () => this.listeners.delete(listener);
  }

  public submitReport(report: Omit<FeltReport, 'id' | 'timestamp' | 'timeString' | 'intensityRoman' | 'intensityColor'>): FeltReport {
    // Sahte ve otomatik spam bildirim engeli
    const rate = antiManipulationService.checkRateLimit('felt');
    if (!rate.allowed) {
      throw new Error(`Yeni bir hissettim bildirimi göndermek için lütfen ${rate.waitSeconds} saniye bekleyin.`);
    }

    let cleanComment = report.comment;
    if (cleanComment) {
      const heuristic = antiManipulationService.analyzeTextSafety(cleanComment);
      if (heuristic.isSuspicious && heuristic.warningMessage) {
        cleanComment = `${cleanComment} [${heuristic.warningMessage}]`;
      }
    }

    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][report.intensity - 1] || 'V';
    const colors = [
      '#64748B', // I
      '#38BDF8', // II
      '#06B6D4', // III
      '#10B981', // IV
      '#F59E0B', // V
      '#F97316', // VI
      '#EF4444', // VII
      '#DC2626', // VIII
      '#991B1B', // IX
      '#7F1D1D'  // X
    ];

    const newReport: FeltReport = {
      ...report,
      id: `felt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      intensityRoman: roman,
      intensityColor: colors[report.intensity - 1] || '#F59E0B'
    };

    this.reports.unshift(newReport);
    if (this.reports.length > 200) {
      this.reports = this.reports.slice(0, 200);
    }

    this.saveToStorage();
    this.notify();

    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'NEW_REPORT', report: newReport });
      } catch {}
    }

    return newReport;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.reports = JSON.parse(raw);
      } else {
        // Initial simulated recent community reports for realism
        this.reports = [
          {
            id: 'felt-init-1',
            intensity: 4,
            intensityRoman: 'IV',
            intensityLabel: 'Hissedildi (Avizeler Sallandı)',
            intensityColor: '#10B981',
            timestamp: Date.now() - 1000 * 60 * 18,
            timeString: '18 dk önce',
            city: 'İstanbul',
            district: 'Kadıköy',
            coordinates: [29.0275, 40.9885],
            buildingType: 'Betonarme Apartman',
            floor: 4,
            comment: 'Yatakta hafif sallandık, avizeler 5-6 saniye salındı.'
          },
          {
            id: 'felt-init-2',
            intensity: 5,
            intensityRoman: 'V',
            intensityLabel: 'Orta Şiddet (Kapı & Pencereler Çarptı)',
            intensityColor: '#F59E0B',
            timestamp: Date.now() - 1000 * 60 * 35,
            timeString: '35 dk önce',
            city: 'Yalova',
            district: 'Çınarcık',
            coordinates: [29.122, 40.643],
            buildingType: 'Müstakil Ev',
            floor: 1,
            comment: 'Derinden gelen bir sesle birlikte 8 saniye sürdü.'
          }
        ];
      }
    } catch {
      this.reports = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reports));
    } catch {}
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.reports);
      } catch {}
    }
  }
}

export const feltReportsService = new FeltReportsService();
