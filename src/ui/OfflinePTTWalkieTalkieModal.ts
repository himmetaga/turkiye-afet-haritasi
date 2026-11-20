import { Icons } from './icons';
import { escapeHtml } from '../utils/safeText';

/**
 * Sesli Not Kaydı (telsiz DEĞİLDİR).
 *
 * Bu ekran yalnızca bu cihazda ses kaydeder ve kaydı hoparlörden çalar.
 * Hiçbir radyo frekansı, mesh ağı ya da başka cihaz kullanılmaz; kayıt kimseye
 * iletilmez. (Sınıf adı, main.ts'teki mevcut bağlantı bozulmasın diye korunmuştur.)
 */

interface VoiceNote {
  id: string;
  timestamp: number;
  durationSec: number;
  audioUrl: string;
}

const STORAGE_KEY = 'afet_ptt_transmissions_v1';
const MAX_STORED = 10;
const MAX_IN_MEMORY = 25;

/** Yalnızca gömülü ses verisi kabul edilir; başka adresler asla fetch edilmez. */
function isAudioDataUrl(value: unknown): value is string {
  return typeof value === 'string' && /^data:audio\//i.test(value);
}

export class OfflinePTTWalkieTalkieModal {
  private container: HTMLElement;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private notes: VoiceNote[] = [];
  private recordStartTime = 0;
  private recordTimerInterval: any = null;

  // Son kaydı hoparlörden aralıklı tekrar çalma
  private isLoopActive = false;
  private loopInterval: any = null;
  private lastAudioUrl: string | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'offline-ptt-walkie-talkie-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md hidden transition-opacity';
    parent.appendChild(this.container);

    this.loadStoredNotes();
    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.stopRecording();
    this.stopLoop();
    this.container.classList.add('hidden');
  }

  private async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        const duration = Math.max(1, Math.round((Date.now() - this.recordStartTime) / 1000));
        this.handleRecordedAudio(blob, duration);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordStartTime = Date.now();
      this.updateRecordButtonState(true);
      this.startRecordTimer();
    } catch (err) {
      alert('Mikrofon erişimi sağlanamadı. Lütfen tarayıcıdan mikrofon izni verin.');
    }
  }

  private stopRecording(): void {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.recordTimerInterval);
    this.updateRecordButtonState(false);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private startRecordTimer(): void {
    const timerEl = this.container.querySelector('#ptt-record-timer');
    this.recordTimerInterval = setInterval(() => {
      if (!this.isRecording) return;
      const sec = ((Date.now() - this.recordStartTime) / 1000).toFixed(1);
      if (timerEl) timerEl.textContent = `${sec} sn kaydediliyor`;
    }, 100);
  }

  private updateRecordButtonState(isRecording: boolean): void {
    const btn = this.container.querySelector('#btn-ptt-trigger');
    const badge = this.container.querySelector('#ptt-recording-badge');
    const timerEl = this.container.querySelector('#ptt-record-timer');

    if (btn) {
      if (isRecording) {
        btn.classList.add('bg-rose-600', 'ring-4', 'ring-rose-500/50', 'scale-95');
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      } else {
        btn.classList.remove('bg-rose-600', 'ring-4', 'ring-rose-500/50', 'scale-95');
        btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
        if (timerEl) timerEl.textContent = 'KAYIT İÇİN BASILI TUTUN';
      }
    }

    if (badge) badge.classList.toggle('hidden', !isRecording);
  }

  private loadStoredNotes(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;

      for (const item of parsed) {
        // Yalnızca gömülü ses verisi (data:audio/...) okunur; başka adres fetch edilmez.
        if (!item || !isAudioDataUrl(item.base64Audio)) continue;
        fetch(item.base64Audio)
          .then((r) => r.blob())
          .then((blob) => {
            this.notes.push({
              id: String(item.id || `note-${Date.now()}`),
              timestamp: Number(item.timestamp) || 0,
              durationSec: Number(item.durationSec) || 0,
              audioUrl: URL.createObjectURL(blob)
            });
            this.notes.sort((a, b) => b.timestamp - a.timestamp);
            this.renderNotes();
          })
          .catch(() => {});
      }
    } catch {}
  }

  private saveNoteLocally(note: VoiceNote, base64Audio: string): void {
    if (!isAudioDataUrl(base64Audio)) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const list: any[] = Array.isArray(parsed) ? parsed : [];
      list.unshift({
        id: note.id,
        timestamp: note.timestamp,
        durationSec: note.durationSec,
        base64Audio
      });
      while (list.length > MAX_STORED) list.pop();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  private handleRecordedAudio(blob: Blob, durationSec: number): void {
    const audioUrl = URL.createObjectURL(blob);
    this.lastAudioUrl = audioUrl;

    const note: VoiceNote = {
      id: `note-${Date.now()}`,
      timestamp: Date.now(),
      durationSec,
      audioUrl
    };

    this.notes.unshift(note);
    if (this.notes.length > MAX_IN_MEMORY) this.notes.pop();
    this.renderNotes();

    // Kayıt yalnızca bu cihazda saklanır; hiçbir yere gönderilmez.
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') this.saveNoteLocally(note, reader.result);
    };
    reader.readAsDataURL(blob);
  }

  private toggleLoop(): void {
    if (this.isLoopActive) {
      this.stopLoop();
    } else {
      const url = this.lastAudioUrl || this.notes[0]?.audioUrl || null;
      if (!url) {
        alert('Önce düğmeye basılı tutarak kısa bir sesli not kaydedin.');
        return;
      }
      this.lastAudioUrl = url;
      this.isLoopActive = true;
      this.playLoopOnce();
      this.loopInterval = setInterval(() => this.playLoopOnce(), 45000);
    }
    this.render();
  }

  private stopLoop(): void {
    this.isLoopActive = false;
    clearInterval(this.loopInterval);
    this.loopInterval = null;
  }

  private playLoopOnce(): void {
    if (!this.lastAudioUrl) return;
    const audio = new Audio(this.lastAudioUrl);
    audio.volume = 1.0;
    audio.play().catch(() => {});
  }

  private renderNotes(): void {
    const feed = this.container.querySelector('#ptt-transmissions-feed');
    if (!feed) return;

    if (this.notes.length === 0) {
      feed.innerHTML = `
        <div class="p-4 text-center text-xs text-gray-500">
          Henüz sesli not yok. Düğmeye basılı tutarak kaydedin.
        </div>
      `;
      return;
    }

    feed.innerHTML = this.notes
      .map((t, idx) => {
        const time = t.timestamp
          ? new Date(t.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '';
        return `
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                ${Icons.mic('w-4 h-4')}
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white flex items-center gap-1.5">
                  <span>Sesli not</span>
                  <span class="text-[10px] text-gray-400 font-mono">${escapeHtml(time)}</span>
                </div>
                <div class="text-[11px] text-gray-400 truncate">${Number(t.durationSec) || 0} sn · yalnızca bu cihazda</div>
              </div>
            </div>

            <button
              data-note-index="${idx}"
              type="button"
              class="btn-play-tx p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[11px] font-semibold active:scale-95 transition-all"
            >
              <span>▶ Dinle</span>
            </button>
          </div>
        `;
      })
      .join('');

    feed.querySelectorAll<HTMLButtonElement>('.btn-play-tx').forEach((btn) => {
      btn.addEventListener('click', () => {
        const note = this.notes[Number(btn.getAttribute('data-note-index'))];
        if (note) new Audio(note.audioUrl).play().catch(() => {});
      });
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="hud-glass rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden border border-white/10 shadow-2xl bg-[#090b10] text-white">
        <!-- Header -->
        <div class="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-white/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              ${Icons.mic('w-5 h-5')}
            </span>
            <div>
              <h2 class="text-sm sm:text-base font-bold text-white">Sesli Not Kaydı (telsiz DEĞİLDİR)</h2>
              <p class="text-[11px] text-gray-400">Kayıt yalnızca bu cihazda saklanır ve hoparlörden çalınır; kimseye iletilmez.</p>
            </div>
          </div>
          <button
            id="btn-close-ptt-modal"
            type="button"
            class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            aria-label="Kapat"
          >
            ${Icons.close('w-4 h-4')}
          </button>
        </div>

        <!-- Body -->
        <div class="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11.5px] text-amber-200 leading-relaxed">
            Bu ekran telsiz değildir: radyo frekansı ya da başka bir cihazla bağlantı kullanmaz, sesinizi kimseye ulaştırmaz.
            Yardım çağırmak için 112'yi arayın; telefon çekmiyorsa düdük çalın ya da boruya / duvara 3'er kez vurun.
          </div>

          <!-- Record button -->
          <div class="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <div id="ptt-recording-badge" class="hidden absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[9px] animate-pulse">
              ● KAYDEDİLİYOR
            </div>

            <div class="text-[11px] font-mono text-gray-400" id="ptt-record-timer">
              KAYIT İÇİN BASILI TUTUN
            </div>

            <button
              id="btn-ptt-trigger"
              type="button"
              class="w-28 h-28 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl flex flex-col items-center justify-center gap-1 select-none transition-all cursor-pointer active:scale-95"
            >
              ${Icons.mic('w-8 h-8')}
              <span class="text-[11px] font-black tracking-wider uppercase">BAS-KAYDET</span>
            </button>

            <p class="text-[10px] text-gray-400 text-center max-w-xs">
              Düğmeye basılı tutarak konuşun; bıraktığınızda kayıt bu cihaza kaydedilir.
            </p>
          </div>

          <!-- Loop playback -->
          <div class="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 text-rose-300 font-bold">
                <span>🔊 Son kaydı aralıklı tekrar çal</span>
              </div>
              <button
                id="btn-toggle-sos-loop"
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                  this.isLoopActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-rose-300 hover:bg-white/15'
                }"
              >
                ${this.isLoopActive ? 'Durdur ⏹' : 'Başlat ▶'}
              </button>
            </div>
            <p class="text-[10.5px] text-gray-300 leading-relaxed">
              Kaydınızı 45 saniyede bir hoparlörden tekrar çalar (yalnızca yakınınızdakiler duyar). Sesi sonuna kadar açın; ekran kapanırsa çalma durabilir.
            </p>
          </div>

          <!-- Notes list -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-gray-300 px-1">
              <span>Kayıtlı sesli notlar</span>
              <span class="text-[10px] text-gray-500 font-mono">bu cihazda</span>
            </div>
            <div id="ptt-transmissions-feed" class="space-y-1.5 max-h-40 overflow-y-auto pr-1"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderNotes();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-ptt-modal')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-toggle-sos-loop')?.addEventListener('click', () => {
      this.toggleLoop();
    });

    const recBtn = q<HTMLButtonElement>('#btn-ptt-trigger');
    if (recBtn) {
      // Touch events (Mobile)
      recBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startRecording();
      });
      recBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.stopRecording();
      });
      recBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.stopRecording();
      });

      // Mouse events (Desktop)
      recBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startRecording();
      });
      recBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.stopRecording();
      });
      recBtn.addEventListener('mouseleave', () => {
        if (this.isRecording) this.stopRecording();
      });
    }
  }
}
