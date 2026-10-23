import { Icons } from './icons';

export class OfflineNotificationToast {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className =
      'fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 opacity-0 -translate-y-4';
    parent.appendChild(this.container);

    window.addEventListener('offline', () => {
      this.show('Çevrimdışı Mod: Kayıtlı Toplanma Alanları ve GPS Pusulası Aktif', true);
    });

    window.addEventListener('online', () => {
      this.show('İnternet Bağlantısı Sağlandı: Canlı Sismik Veriler Güncelleniyor', false);
    });
  }

  public show(message: string, isOffline: boolean): void {
    this.container.innerHTML = `
      <div class="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl ${
        isOffline ? 'bg-amber-500/20 text-amber-200 shadow-glow-red' : 'bg-emerald-500/20 text-emerald-300'
      } hud-glass shadow-2xl backdrop-blur-xl text-xs font-medium">
        ${isOffline ? Icons.wifiOff('w-4 h-4 text-amber-300') : Icons.wifi('w-4 h-4 text-emerald-400')}
        <span>${message}</span>
      </div>
    `;

    this.container.classList.remove('opacity-0', '-translate-y-4');
    this.container.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      this.container.classList.remove('opacity-100', 'translate-y-0');
      this.container.classList.add('opacity-0', '-translate-y-4');
    }, 4500);
  }
}
