import { Icons } from './icons';
import { bitChatService } from '../services/bitChatService';

interface RadioTransmission {
  id: string;
  senderName: string;
  channel: string;
  timestamp: number;
  durationSec: number;
  audioBlob?: Blob;
  audioUrl?: string;
  isMe: boolean;
}

export class OfflinePTTWalkieTalkieModal {
  private container: HTMLElement;
  private audioCtx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private currentChannel = 'Kanal 8 (446.093 MHz - Arama Kurtarma)';
  private transmissions: RadioTransmission[] = [];
  private recordStartTime = 0;
  private recordTimerInterval: any = null;

  // Auto SOS Loop
  private isSosLoopActive = false;
  private sosLoopInterval: any = null;
  private savedSosAudioBlob: Blob | null = null;
  private savedSosAudioUrl: string | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'offline-ptt-walkie-talkie-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md hidden transition-opacity';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.stopRecording();
    this.container.classList.add('hidden');
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Realistic Roger Beep: 1200 Hz then 1500 Hz
  private playRogerBeep(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1500, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.18);
    } catch {}
  }

  // Realistic Squelch Click & White Noise Burst
  private playSquelchSound(): void {
    try {
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 0.05; // 50ms burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  }

  // 1750 Hz Repeater Tone
  private play1750HzTone(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  private async startRecording(): Promise<void> {
    if (this.isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.playSquelchSound();

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
      this.updatePttButtonState(true);
      this.startRecordTimer();
    } catch (err) {
      alert('Mikrofon erişimi sağlanamadı. Lütfen tarayıcıdan mikrofon izni verin.');
    }
  }

  private stopRecording(): void {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.recordTimerInterval);
    this.updatePttButtonState(false);
    this.playRogerBeep();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private startRecordTimer(): void {
    const timerEl = this.container.querySelector('#ptt-record-timer');
    this.recordTimerInterval = setInterval(() => {
      if (!this.isRecording) return;
      const sec = ((Date.now() - this.recordStartTime) / 1000).toFixed(1);
      if (timerEl) timerEl.textContent = `${sec}s TX`;
    }, 100);
  }

  private updatePttButtonState(isTransmitting: boolean): void {
    const btn = this.container.querySelector('#btn-ptt-trigger');
    const onAirBadge = this.container.querySelector('#ptt-on-air-badge');
    const timerEl = this.container.querySelector('#ptt-record-timer');

    if (btn) {
      if (isTransmitting) {
        btn.classList.add('bg-rose-600', 'ring-4', 'ring-rose-500/50', 'scale-95');
        btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
      } else {
        btn.classList.remove('bg-rose-600', 'ring-4', 'ring-rose-500/50', 'scale-95');
        btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
        if (timerEl) timerEl.textContent = 'MANDALA BASILI TUTUN';
      }
    }

    if (onAirBadge) {
      if (isTransmitting) {
        onAirBadge.classList.remove('hidden');
      } else {
        onAirBadge.classList.add('hidden');
      }
    }
  }

  private handleRecordedAudio(blob: Blob, durationSec: number): void {
    const audioUrl = URL.createObjectURL(blob);
    this.savedSosAudioBlob = blob;
    this.savedSosAudioUrl = audioUrl;

    const trans: RadioTransmission = {
      id: `tx-${Date.now()}`,
      senderName: 'Ben (Bu Cihaz)',
      channel: this.currentChannel,
      timestamp: Date.now(),
      durationSec,
      audioBlob: blob,
      audioUrl,
      isMe: true
    };

    this.transmissions.unshift(trans);
    this.renderTransmissions();

    // Broadcast over P2P mesh
    bitChatService.broadcastMessage(
      `🎙️ [${this.currentChannel}] Telsiz Anonsu (${durationSec}s)`,
      'sos'
    );
  }

  private toggleSosVoiceLoop(): void {
    this.isSosLoopActive = !this.isSosLoopActive;
    if (this.isSosLoopActive) {
      if (!this.savedSosAudioUrl) {
        alert('Önce mandala basılı tutarak en az bir kez 3-5 saniyelik sesli S.O.S mesajınızı kaydedin.');
        this.isSosLoopActive = false;
        return;
      }
      this.playSosVoiceLoop();
      this.sosLoopInterval = setInterval(() => {
        this.playSosVoiceLoop();
      }, 45000); // Repeat every 45s
    } else {
      clearInterval(this.sosLoopInterval);
    }
    this.render();
  }

  private playSosVoiceLoop(): void {
    if (!this.savedSosAudioUrl) return;
    this.playSquelchSound();
    setTimeout(() => {
      const audio = new Audio(this.savedSosAudioUrl!);
      audio.volume = 1.0;
      audio.onended = () => {
        this.playRogerBeep();
      };
      audio.play().catch(() => {});
    }, 150);
  }

  private renderTransmissions(): void {
    const feed = this.container.querySelector('#ptt-transmissions-feed');
    if (!feed) return;

    if (this.transmissions.length === 0) {
      feed.innerHTML = `
        <div class="p-4 text-center text-xs text-gray-500">
          Henüz telsiz anonsu yapılmadı. Mandala basılı tutarak sesinizi kaydedin ve yayınlayın.
        </div>
      `;
      return;
    }

    feed.innerHTML = this.transmissions
      .map((t) => {
        const time = new Date(t.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="p-2 rounded-lg ${t.isMe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
                ${Icons.radio('w-4 h-4')}
              </span>
              <div class="min-w-0">
                <div class="font-bold text-white flex items-center gap-1.5">
                  <span>${t.senderName}</span>
                  <span class="text-[10px] text-gray-400 font-mono">${time}</span>
                </div>
                <div class="text-[11px] text-gray-400 truncate">${t.channel} · ${t.durationSec}s</div>
              </div>
            </div>

            <button
              data-audio-url="${t.audioUrl}"
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
        const url = btn.getAttribute('data-audio-url');
        if (url) {
          this.playSquelchSound();
          setTimeout(() => {
            const a = new Audio(url);
            a.onended = () => this.playRogerBeep();
            a.play();
          }, 100);
        }
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
              ${Icons.radio('w-5 h-5')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-bold text-white">İnternetsiz Bas-Konuş Telsiz</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">P2P MESH</span>
              </div>
              <p class="text-[11px] text-gray-400">PMR 446 & WebRTC Yerel Ağ Bas-Konuş (PTT)</p>
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
          <!-- Channel Selector & 1750 Hz Tone -->
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Telsiz Kanalı</label>
              <select
                id="ptt-channel-select"
                class="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Kanal 8 (446.093 MHz - Arama Kurtarma)">Kanal 8 (446.093 MHz - Arama Kurtarma)</option>
                <option value="Kanal 1 (446.006 MHz - Genel Çağrı)">Kanal 1 (446.006 MHz - Genel Çağrı)</option>
                <option value="Kanal 2 (446.018 MHz - Tıbbi & Triyaj)">Kanal 2 (446.018 MHz - Tıbbi & Triyaj)</option>
                <option value="Kanal 16 (446.193 MHz - Kriz & Lojistik)">Kanal 16 (446.193 MHz - Kriz & Lojistik)</option>
              </select>
            </div>

            <button
              id="btn-1750-tone"
              type="button"
              class="mt-4 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white font-mono text-[11px] font-bold border border-white/10 transition-all flex items-center gap-1"
              title="Telsiz rölelerini tetikleyen 1750 Hz tonu çalar"
            >
              <span>1750Hz</span>
            </button>
          </div>

          <!-- PTT (Push-To-Talk) Tactical Button Area -->
          <div class="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <div id="ptt-on-air-badge" class="hidden absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[9px] animate-pulse">
              ● YAYINDA (ON AIR)
            </div>

            <div class="text-[11px] font-mono text-gray-400" id="ptt-record-timer">
              MANDALA BASILI TUTUN
            </div>

            <!-- Big PTT Trigger Button -->
            <button
              id="btn-ptt-trigger"
              type="button"
              class="w-28 h-28 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl flex flex-col items-center justify-center gap-1 select-none transition-all cursor-pointer active:scale-95"
            >
              ${Icons.mic('w-8 h-8')}
              <span class="text-[11px] font-black tracking-wider uppercase">BAS-KONUŞ</span>
              <span class="text-[9px] opacity-75 font-mono">PTT MANDAL</span>
            </button>

            <p class="text-[10px] text-gray-400 text-center max-w-xs">
              Mandala basılı tutarak konuşun, bıraktığınızda <em>Roger Beep</em> çalar ve anons yerel P2P ağına dağıtılır.
            </p>
          </div>

          <!-- Automated SOS Voice Loop -->
          <div class="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 text-rose-300 font-bold">
                <span>🔊 Otomatik Enkaz S.O.S Ses Döngüsü</span>
              </div>
              <button
                id="btn-toggle-sos-loop"
                type="button"
                class="px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                  this.isSosLoopActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-white/10 text-rose-300 hover:bg-white/15'
                }"
              >
                ${this.isSosLoopActive ? 'Durdur ⏹' : 'Başlat ▶'}
              </button>
            </div>
            <p class="text-[10.5px] text-gray-300 leading-relaxed">
              Enkaz altındayken sesinizi yormamak için son kaydettiğiniz ses anonsunu her 45 saniyede bir maksimum ses seviyesinde hoparlörden telsiz anonsu olarak otomatik tekrarlar.
            </p>
          </div>

          <!-- Radio Transmissions Feed -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-gray-300 px-1">
              <span>📻 Kanal Dinleme ve Son Anonslar</span>
              <span class="text-[10px] text-emerald-400 font-mono">CANLI KANAL</span>
            </div>
            <div id="ptt-transmissions-feed" class="space-y-1.5 max-h-40 overflow-y-auto pr-1"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderTransmissions();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q<HTMLButtonElement>('#btn-close-ptt-modal')?.addEventListener('click', () => this.hide());

    const channelSelect = q<HTMLSelectElement>('#ptt-channel-select');
    channelSelect?.addEventListener('change', () => {
      this.currentChannel = channelSelect.value;
    });

    q<HTMLButtonElement>('#btn-1750-tone')?.addEventListener('click', () => {
      this.play1750HzTone();
    });

    q<HTMLButtonElement>('#btn-toggle-sos-loop')?.addEventListener('click', () => {
      this.toggleSosVoiceLoop();
    });

    const pttBtn = q<HTMLButtonElement>('#btn-ptt-trigger');
    if (pttBtn) {
      // Touch events (Mobile)
      pttBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.startRecording();
      });
      pttBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.stopRecording();
      });
      pttBtn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.stopRecording();
      });

      // Mouse events (Desktop)
      pttBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startRecording();
      });
      pttBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.stopRecording();
      });
      pttBtn.addEventListener('mouseleave', () => {
        if (this.isRecording) this.stopRecording();
      });
    }
  }
}
