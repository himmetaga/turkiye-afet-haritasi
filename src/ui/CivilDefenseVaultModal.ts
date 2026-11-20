import { Icons } from './icons';
import { escapeHtml } from '../utils/safeText';
import { civilDefenseProtocols, OfflinePropertyCredential, BarterItem } from '../services/civilDefenseProtocols';

export class CivilDefenseVaultModal {
  private container: HTMLElement;
  private activeTab: 'vault' | 'barter' | 'dask' = 'vault';

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'civil-defense-vault-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-2xl hidden transition-all duration-300';
    parent.appendChild(this.container);

    this.render();
  }

  public show(): void {
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  private render(): void {
    const creds = civilDefenseProtocols.getSavedCredentials();
    const barterList = civilDefenseProtocols.getBarterList();

    this.container.innerHTML = `
      <div class="ios27-glass rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden text-white shadow-2xl border border-white/15">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              ⚖️
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm sm:text-base font-black tracking-tight text-white">Evrak Notlarım & İhtiyaç Listem</h2>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  YALNIZCA BU CİHAZDA
                </span>
              </div>
              <p class="text-[11px] text-gray-400">Notlar şifrelenmez ve kimseyle paylaşılmaz; tarayıcı verisi silinirse kaybolur</p>
            </div>
          </div>
          <button id="btn-close-vault" class="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 transition-all">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="grid grid-cols-3 p-2 bg-black/40 border-b border-white/10 text-xs font-bold shrink-0">
          <button
            id="tab-vault-creds"
            type="button"
            class="py-2 rounded-xl transition-all ${
              this.activeTab === 'vault' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }"
          >
            📄 Evrak Notlarım (${creds.length})
          </button>
          <button
            id="tab-vault-barter"
            type="button"
            class="py-2 rounded-xl transition-all ${
              this.activeTab === 'barter' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }"
          >
            📝 İhtiyaç Listem (${barterList.length})
          </button>
          <button
            id="tab-vault-dask"
            type="button"
            class="py-2 rounded-xl transition-all ${
              this.activeTab === 'dask' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }"
          >
            ⏱️ DASK İhbarı
          </button>
        </div>

        <!-- Body Area -->
        <div class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          ${
            this.activeTab === 'vault'
              ? `
            <!-- Tab 1: Property Credentials Vault -->
            <div class="space-y-3">
              <!-- Add Credential Form -->
              <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <span class="font-bold text-gray-200 block">➕ Yeni evrak notu (şifrelenmez; kimlik numarası gibi hassas bilgileri yazmayın)</span>
                <div class="grid grid-cols-2 gap-2">
                  <select id="select-vault-type" class="px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white outline-none">
                    <option value="tapu">Tapu Senedi</option>
                    <option value="kira_kontrati">Kira Sözleşmesi</option>
                    <option value="kimlik">T.C. Kimlik Belgesi</option>
                    <option value="ruhsat">Araç Ruhsatı</option>
                    <option value="sigorta_dask">DASK Poliçesi</option>
                  </select>
                  <input
                    id="input-vault-serial"
                    type="text"
                    placeholder="Ada/Parsel/Poliçe No"
                    class="px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
                  />
                </div>
                <input
                  id="input-vault-owner"
                  type="text"
                  placeholder="Hak Sahibi Adı Soyadı"
                  class="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
                />
                <button
                  id="btn-add-vault-item"
                  type="button"
                  class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
                >
                  Bu cihaza kaydet
                </button>
              </div>

              <!-- List of Saved Credentials -->
              <div class="space-y-2">
                ${
                  creds.length === 0
                    ? `<div class="p-4 text-center text-gray-500 text-xs">Henüz mülkiyet evrakı kaydedilmedi.</div>`
                    : creds
                        .map(
                          (c) => `
                  <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                    <div>
                      <div class="font-bold text-white uppercase text-xs">${escapeHtml(String(c.docType ?? '').replace('_', ' '))}: ${escapeHtml(c.serialNumber)}</div>
                      <div class="text-[11px] text-gray-300">Sahip: ${escapeHtml(c.ownerName)}</div>
                      <div class="text-[9.5px] text-gray-500 font-mono">${new Date(c.addedAt).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <button data-del-id="${escapeHtml(c.id)}" class="btn-del-vault p-1.5 text-rose-400 hover:text-rose-300 text-xs">Sil</button>
                  </div>
                `
                        )
                        .join('')
                }
              </div>
            </div>
          `
              : this.activeTab === 'barter'
              ? `
            <!-- Tab 2: P2P Barter Ledger -->
            <div class="space-y-3">
              <div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <span class="font-bold text-gray-200 block">📝 Kişisel liste: fazlam / ihtiyacım (kimseye iletilmez)</span>
                <div class="grid grid-cols-2 gap-2">
                  <select id="select-barter-type" class="px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white outline-none">
                    <option value="offer">🟢 Elimde Fazla Var (Paylaşabilirim)</option>
                    <option value="need">🔴 Acil İhtiyacım Var</option>
                  </select>
                  <input
                    id="input-barter-title"
                    type="text"
                    placeholder="Malzeme Adı (Örn: 2 Koli Bebek Bezi No 3)"
                    class="px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
                  />
                </div>
                <input
                  id="input-barter-loc"
                  type="text"
                  placeholder="Bulunduğunuz Çadır / Konum (Örn: 4. Çadır Yanı)"
                  class="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 outline-none"
                />
                <button
                  id="btn-add-barter-item"
                  type="button"
                  class="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
                >
                  Listeme Ekle
                </button>
              </div>

              <div class="space-y-2">
                ${
                  barterList.length === 0
                    ? `<div class="p-4 text-center text-gray-500 text-xs">Listeniz boş. Buraya yazdıklarınızı başkaları göremez.</div>`
                    : barterList
                        .map(
                          (b) => `
                  <div class="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                        b.type === 'offer' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }">
                        ${b.type === 'offer' ? 'FAZLA STOK' : 'ACİL İHTİYAÇ'}
                      </span>
                      <div class="font-bold text-white text-xs mt-1">${escapeHtml(b.title)}</div>
                      <div class="text-[10.5px] text-gray-400">Konum: ${escapeHtml(b.contactLocation)}</div>
                    </div>
                  </div>
                `
                        )
                        .join('')
                }
              </div>
            </div>
          `
              : `
            <!-- Tab 3: DASK 15 Gün Süre Sayacı -->
            <div class="space-y-3">
              <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
                <span class="font-bold block text-sm">⏱️ DASK hasar ihbarı: 15 iş günü</span>
                <p class="text-[11px] text-gray-300 leading-relaxed">
                  Zorunlu Deprem Sigortası genel şartlarına göre hasar, öğrenildikten sonra en geç 15 iş günü içinde bildirilmelidir. Güncel süre ve koşulları DASK'tan teyit edin.
                </p>
                <div class="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-center text-white font-bold">
                  DASK ALO 125 · dask.gov.tr
                </div>
              </div>

              <div class="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <span class="font-bold text-white block">📜 Genel bilgi (hukuki danışmanlık değildir):</span>
                <p class="text-[11px] text-gray-300">• <strong>Ölüm Karinesi & Gaiplik:</strong> Enkaz altında cesedine ulaşılamayan yakınlar için Sulh Hukuk Mahkemesi veya Nüfus Müdürlüğü gaiplik tescili.</p>
                <p class="text-[11px] text-gray-300">• <strong>Kira & Taşınma Yardımı:</strong> Ev sahiplerine ve kiracılara yönelik AFAD hak sahipliği başvurusu.</p>
                <p class="text-[11px] text-gray-300">• <strong>Enkaz Eşya Kurtarma:</strong> Ağır hasarlı binalara izinsiz girilmesi yasaktır; eşya kurtarma valilik/AFAD kontrollü vinç saatlerinde yapılır.</p>
              </div>
            </div>
          `
          }
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const q = <T extends HTMLElement>(sel: string) => this.container.querySelector(sel) as T | null;

    q('#btn-close-vault')?.addEventListener('click', () => this.hide());

    q('#tab-vault-creds')?.addEventListener('click', () => {
      this.activeTab = 'vault';
      this.render();
    });

    q('#tab-vault-barter')?.addEventListener('click', () => {
      this.activeTab = 'barter';
      this.render();
    });

    q('#tab-vault-dask')?.addEventListener('click', () => {
      this.activeTab = 'dask';
      this.render();
    });

    q<HTMLButtonElement>('#btn-add-vault-item')?.addEventListener('click', () => {
      const type = (q<HTMLSelectElement>('#select-vault-type')?.value || 'tapu') as any;
      const serial = q<HTMLInputElement>('#input-vault-serial')?.value.trim();
      const owner = q<HTMLInputElement>('#input-vault-owner')?.value.trim();

      if (!serial || !owner) {
        alert('Lütfen evrak seri no ve hak sahibi adını girin.');
        return;
      }

      civilDefenseProtocols.saveCredential({
        docType: type,
        serialNumber: serial,
        ownerName: owner,
        title: `${type.toUpperCase()} - ${serial}`,
        notes: ''
      });
      this.render();
    });

    this.container.querySelectorAll<HTMLButtonElement>('.btn-del-vault').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-id');
        if (id) {
          civilDefenseProtocols.deleteCredential(id);
          this.render();
        }
      });
    });

    q<HTMLButtonElement>('#btn-add-barter-item')?.addEventListener('click', () => {
      const type = (q<HTMLSelectElement>('#select-barter-type')?.value || 'offer') as 'offer' | 'need';
      const title = q<HTMLInputElement>('#input-barter-title')?.value.trim();
      const loc = q<HTMLInputElement>('#input-barter-loc')?.value.trim() || 'Belirtilmedi';

      if (!title) {
        alert('Lütfen malzeme adını yazın.');
        return;
      }

      civilDefenseProtocols.addBarterItem({
        type,
        category: 'gida',
        title,
        quantity: '1',
        contactLocation: loc
      });
      this.render();
    });
  }
}
