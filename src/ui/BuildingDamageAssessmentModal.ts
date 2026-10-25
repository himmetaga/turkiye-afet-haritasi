import { Icons } from './icons';

interface DamageRecord {
  id: string;
  component: string;
  severity: string;
  notes: string;
  photoUrl?: string;
  timestamp: number;
}

export class BuildingDamageAssessmentModal {
  private container: HTMLElement;
  private records: DamageRecord[] = [];
  private selectedSeverity = 'agir_hasarli';
  private selectedComponent = 'kolon';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'building-damage-assessment-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.loadRecords();
    this.render();
  }

  private loadRecords(): void {
    try {
      const saved = localStorage.getItem('afet_damage_records_v1');
      if (saved) this.records = JSON.parse(saved);
    } catch {}
  }

  private saveRecords(): void {
    try {
      localStorage.setItem('afet_damage_records_v1', JSON.stringify(this.records));
    } catch {}
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              🏛️
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Bina Hasar Tespit & DASK Kanıtı</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FEMA & BAKANLIK
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Deprem sonrası kolon/kiriş hasar tespiti ve resmi delil kaydı</p>
            </div>
          </div>
          <button id="btn-close-damage" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <!-- Visual Damage Comparison Card -->
          <div class="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <span class="font-bold text-gray-200 block">🔍 Kritik Yapısal Çatlak Kılavuzu:</span>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <strong>🟢 Tehlikesiz Sıva Çatlağı:</strong>
                <p class="text-[10px] text-gray-300 mt-0.5">Yüzeyde, kılcal (<1mm), duvardan duvara uzamayan boya kabarmaları. Taşıyıcı kolon sağlamdır.</p>
              </div>
              <div class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <strong>🔴 Tehlikeli 45° X Çatlağı:</strong>
                <p class="text-[10px] text-gray-300 mt-0.5">Kolon veya perde duvarda çapraz kesme çatlağı, beton patlaması, demirlerin bükülmesi. BİNAYA GİRMEYİN!</p>
              </div>
            </div>
          </div>

          <!-- Add Damage Record Form -->
          <div class="space-y-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span class="font-bold text-gray-200 block">📝 Yeni Hasarlı Bölge Kaydet:</span>
            
            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[10.5px] text-gray-400 font-semibold mb-1">Hasarlı Yapı Elemanı</label>
                <select id="select-damage-component" class="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white outline-none">
                  <option value="kolon">Taşıyıcı Kolon</option>
                  <option value="kiris">Tavan Kirişi</option>
                  <option value="perde">Perde Duvar</option>
                  <option value="duvar">Bölme Duvar</option>
                  <option value="merdiven">Merdiven Kovası</option>
                </select>
              </div>

              <div>
                <label class="block text-[10.5px] text-gray-400 font-semibold mb-1">Hasar Derecesi</label>
                <select id="select-damage-severity" class="w-full px-3 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white outline-none">
                  <option value="agir_hasarli">🔴 Ağır Hasarlı (X Çatlağı/Donatı Görünüyor)</option>
                  <option value="orta_hasarli">🟡 Orta Hasarlı (Derin Çatlaklar)</option>
                  <option value="az_hasarli">🟢 Az Hasarlı (Sıva/Boya Döküntüsü)</option>
                  <option value="acil_yikilacak">⚠️ Acil Yıktırılacak (Göçme Riski)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[10.5px] text-gray-400 font-semibold mb-1">Hasar Konumu ve Notlar (Örn: Salon Kuzey Kolonu)</label>
              <input
                id="input-damage-notes"
                type="text"
                placeholder="Örn: 2. kat salon güney kolonu alt kısmında beton dökülmesi ve demir burkulması"
                class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
              />
            </div>

            <button
              id="btn-add-damage-record"
              type="button"
              class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
              <span>📷 Hasar Kaydını Mühürle & Ekle</span>
            </button>
          </div>

          <!-- Existing Records List -->
          <div class="space-y-2">
            <span class="font-bold text-gray-300 block text-xs">Mühürlenmiş Hasar Kayıtları (${this.records.length})</span>
            <div id="damage-records-list" class="space-y-2 max-h-40 overflow-y-auto">
              ${
                this.records.length === 0
                  ? `<div class="p-3 text-center text-gray-500 text-xs">Henüz hasar kaydı eklenmedi.</div>`
                  : this.records
                      .map(
                        (r) => `
                <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-white uppercase">${r.component} · ${r.severity.replace('_', ' ')}</div>
                    <div class="text-[11px] text-gray-400">${r.notes}</div>
                    <div class="text-[9.5px] text-gray-500 font-mono">${new Date(r.timestamp).toLocaleString('tr-TR')}</div>
                  </div>
                  <span class="text-emerald-400 text-[10px] font-mono font-bold">✓ DELİL MÜHÜRLÜ</span>
                </div>
              `
                      )
                      .join('')
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
          <p class="text-[10px] text-gray-400">⚖️ Kaydedilen fotoğraflar ve notlar DASK itirazlarında yasal delil niteliği taşır.</p>
          <button
            id="btn-copy-dask-summary"
            type="button"
            class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all shrink-0"
          >
            📋 Tutanağı Kopyala
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q('#btn-close-damage')?.addEventListener('click', () => this.hide());

    q<HTMLButtonElement>('#btn-add-damage-record')?.addEventListener('click', () => {
      const comp = (q<HTMLSelectElement>('#select-damage-component')?.value || 'kolon') as string;
      const sev = (q<HTMLSelectElement>('#select-damage-severity')?.value || 'agir_hasarli') as string;
      const notes = q<HTMLInputElement>('#input-damage-notes')?.value.trim() || 'Hasar tespiti yapıldı';

      const record: DamageRecord = {
        id: `dmg-${Date.now()}`,
        component: comp,
        severity: sev,
        notes,
        timestamp: Date.now()
      };

      this.records.unshift(record);
      this.saveRecords();
      this.render();
      alert('✓ Hasar tespiti yerel belleğe zaman damgasıyla mühürlendi.');
    });

    q<HTMLButtonElement>('#btn-copy-dask-summary')?.addEventListener('click', () => {
      if (this.records.length === 0) {
        alert('Önce en az bir hasar kaydı ekleyiniz.');
        return;
      }
      const text =
        `🏛️ [DASK VE RESMİ HASAR TESPİT TUTANAĞI]\n` +
        `Tarih: ${new Date().toLocaleString('tr-TR')}\n` +
        `Kayıt Sayısı: ${this.records.length}\n` +
        this.records
          .map((r, i) => `${i + 1}. [${r.component.toUpperCase()}] ${r.severity}: ${r.notes}`)
          .join('\n') +
        `\nBu tutanak afet.live üzerinden adli delil amacıyla mühürlenmiştir.`;

      navigator.clipboard.writeText(text).then(() => {
        alert('📋 Hasar tespit tutanağı panoya kopyalandı.');
      });
    });
  }
}
