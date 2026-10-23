import { Icons } from './icons';

export class SaaSDashboardModal {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'saas-dashboard-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
  }

  public hide(): void {
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private copyCode(text: string, btnId: string): void {
    navigator.clipboard.writeText(text);
    const btn = this.container.querySelector(`#${btnId}`);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Kopyalandı!';
      setTimeout(() => {
        btn.textContent = orig;
      }, 2000);
    }
  }

  private render(): void {
    const iframeCode = `<iframe 
  src="https://afet.live/widget?city=istanbul&theme=dark" 
  width="100%" 
  height="500" 
  style="border:none; border-radius:16px; overflow:hidden;"
  allow="geolocation"
  title="afet.live Canlı Afet ve Toplanma Widget'ı">
</iframe>`;

    const apiCode = `// Kurumsal Erken Uyarı & Doğrulanmış Veri Entegrasyonu
fetch('https://afet.live/data/emergency-facilities.geojson')
  .then(res => res.json())
  .then(data => {
    // 1.135 doğrulanmış hastane ve kapı bazlı 514 nöbetçi eczane
    console.log('Aktif Acil Tesisler:', data.features.length);
  });`;

    this.container.innerHTML = `
      <div class="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-obsidian-900 border border-white/10 p-6 shadow-2xl backdrop-blur-2xl text-white">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div class="flex items-center gap-3">
            <span class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              ${Icons.shield('w-6 h-6')}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-black tracking-wide text-white">
                  afet.live Enterprise & SaaS Geliştirici Portalı
                </h3>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  v2.4 PRO
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                Kurumsal afet hazırlığı, harici web siteleri için canlı 3B widget ve doğrulanmış GIS API ağı
              </p>
            </div>
          </div>

          <button id="btn-close-saas" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all">
            ${Icons.close('w-5 h-5 text-gray-400')}
          </button>
        </div>

        <!-- System Telemetry & SLAs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="rounded-xl bg-white/5 p-3 border border-white/5">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Toplanma Alanı</span>
            <div class="text-xl font-black font-mono text-emerald-400 mt-1">13.356</div>
            <span class="text-[10px] text-gray-500">AFAD & Valilik Doğrulanmış</span>
          </div>
          <div class="rounded-xl bg-white/5 p-3 border border-white/5">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Acil Servis Hastane</span>
            <div class="text-xl font-black font-mono text-cyan-400 mt-1">1.135</div>
            <span class="text-[10px] text-gray-500">Bina Giriş GPS'li</span>
          </div>
          <div class="rounded-xl bg-white/5 p-3 border border-white/5">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Nöbetçi Eczane</span>
            <div class="text-xl font-black font-mono text-amber-400 mt-1">514</div>
            <span class="text-[10px] text-gray-500">7/24 Kesintisiz Kapı GPS</span>
          </div>
          <div class="rounded-xl bg-white/5 p-3 border border-white/5">
            <span class="text-[10px] text-gray-400 font-mono uppercase">Sismik Algılama</span>
            <div class="text-xl font-black font-mono text-rose-400 mt-1">&lt;15 ms</div>
            <span class="text-[10px] text-gray-500">P/S Dalgası Simülasyonu</span>
          </div>
        </div>

        <!-- Section 1: Embeddable Widget Generator -->
        <div class="mb-6 rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span>🌐 Web Sitenize Canlı Afet Widget'ı Ekleyin</span>
            </h4>
            <button
              id="btn-copy-iframe"
              class="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all active:scale-95"
            >
              Kodu Kopyala
            </button>
          </div>
          <p class="text-xs text-gray-400 mb-3">
            Belediyeler, haber siteleri ve kurumsal intranetler için mobil uyumlu, karanlık temalı canlı afet haritası.
          </p>
          <pre class="p-3 rounded-lg bg-obsidian-950 border border-white/10 text-xs font-mono text-gray-300 overflow-x-auto"><code>${iframeCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
        </div>

        <!-- Section 2: REST / GeoJSON API Endpoint Access -->
        <div class="mb-6 rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <span>⚡ Kurumsal REST & GeoJSON Veri Akışı</span>
            </h4>
            <button
              id="btn-copy-api"
              class="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition-all active:scale-95"
            >
              Kodu Kopyala
            </button>
          </div>
          <p class="text-xs text-gray-400 mb-3">
            Akıllı bina otomasyon sistemleri ve doğalgaz/elektrik acil kesme valfleri için açık veri arayüzü.
          </p>
          <pre class="p-3 rounded-lg bg-obsidian-950 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto"><code>${apiCode}</code></pre>
        </div>

        <!-- Section 3: Live Test Simulation Trigger -->
        <div class="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-center justify-between gap-4">
          <div>
            <h5 class="text-xs font-bold text-rose-300">Sismik Erken Uyarı Tatbikatı (Simülasyon Modu)</h5>
            <p class="text-[11px] text-gray-400 mt-0.5">
              Marmara Denizi açıklarında M6.4 büyüklüğünde yapay bir deprem dalgası başlatır; sesli siren ve P/S dalga yayılımını test eder.
            </p>
          </div>

          <button
            id="btn-trigger-marmara-sim"
            class="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs active:scale-95 shadow-glow-rose transition-all flex-shrink-0"
          >
            Tatbikat Başlat ⚡
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-close-saas')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#btn-copy-iframe')?.addEventListener('click', () => this.copyCode(iframeCode, 'btn-copy-iframe'));
    this.container.querySelector('#btn-copy-api')?.addEventListener('click', () => this.copyCode(apiCode, 'btn-copy-api'));
    this.container.querySelector('#btn-trigger-marmara-sim')?.addEventListener('click', () => {
      this.hide();
      import('../services/earlyWarningEngine').then(({ earlyWarningEngine }) => {
        // Silivri / Marmara epicenter [28.18, 40.85]
        earlyWarningEngine.triggerSimulation([28.18, 40.85], 6.4, 12, 'Marmara Denizi (Silivri Açıkları)');
      });
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.hide();
    });
  }
}
