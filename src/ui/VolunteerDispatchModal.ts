import qrcode from 'qrcode-generator';
import { Icons } from './icons';
import { setupModalMobileDismiss, registerModalOpen, registerModalClose } from '../utils/mobileModalHelper';
import {
  volunteerDispatchService,
  VolunteerProfile,
  VolunteerSkillRole,
  VOLUNTEER_ROLES
} from '../services/volunteerDispatchService';

export class VolunteerDispatchModal {
  private container: HTMLElement;
  private activeTab: 'id_card' | 'edit_profile' | 'code_of_conduct' = 'id_card';
  private profile: VolunteerProfile;

  constructor(parent: HTMLElement) {
    this.profile = volunteerDispatchService.getProfile();

    this.container = document.createElement('div');
    this.container.id = 'volunteer-dispatch-modal';
    this.container.className =
      'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/85 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300';
    parent.appendChild(this.container);

    setupModalMobileDismiss({
      container: this.container,
      hide: () => this.hide()
    });

    this.render();
  }

  public show(): void {
    this.profile = volunteerDispatchService.getProfile();
    // If name is empty, open edit profile tab by default
    if (!this.profile.fullName) {
      this.activeTab = 'edit_profile';
    }
    this.render();
    this.container.classList.remove('opacity-0', 'pointer-events-none');
    this.container.classList.add('opacity-100', 'pointer-events-auto');
    registerModalOpen('volunteer-dispatch-modal', () => this.hide());
  }

  public hide(): void {
    registerModalClose('volunteer-dispatch-modal');
    this.container.classList.remove('opacity-100', 'pointer-events-auto');
    this.container.classList.add('opacity-0', 'pointer-events-none');
  }

  private generateQrSvg(text: string): string {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 3.5, margin: 2, scalable: true });
    } catch {
      return `<div class="p-6 text-rose-400 text-xs">QR oluşturulamadı.</div>`;
    }
  }

  private render(): void {
    const roleDef = VOLUNTEER_ROLES[this.profile.primaryRole] || VOLUNTEER_ROLES.GENERAL_SUPPORT;
    const qrPayload = volunteerDispatchService.generateQrPayload(this.profile);
    const qrSvg = this.generateQrSvg(qrPayload);

    this.container.innerHTML = `
      <div class="relative w-full max-w-xl max-h-[92vh] flex flex-col hud-glass rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-gray-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              ${Icons.volunteerBadge('w-5 h-5')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-white tracking-wide">Afet Gönüllü Sahra Pasaportu</h2>
                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider" style="color: ${roleDef.badgeColor}; background: ${roleDef.badgeColor}20; border: 1px solid ${roleDef.badgeColor}40;">
                  ${roleDef.title.split(' (')[0]}
                </span>
              </div>
              <p class="text-xs text-gray-400">INSARAG & AFAD Uyumlu Çevrimdışı Kriz Akreditasyonu</p>
            </div>
          </div>
          <button id="btn-close-volunteer" class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            ${Icons.close('w-5 h-5')}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex items-center gap-2 px-5 pt-3 pb-1 border-b border-white/5 bg-black/20 text-xs font-semibold">
          <button data-tab="id_card" class="btn-vol-tab px-3 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'id_card'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            🪪 Sahra Görev Kartı & QR
          </button>
          <button data-tab="edit_profile" class="btn-vol-tab px-3 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'edit_profile'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            ✏️ Bilgileri Düzenle
          </button>
          <button data-tab="code_of_conduct" class="btn-vol-tab px-3 py-1.5 rounded-xl transition-all ${
            this.activeTab === 'code_of_conduct'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
              : 'text-gray-400 hover:text-white'
          }">
            🛡️ Saha Kuralları
          </button>
        </div>

        <!-- Body Content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          ${this.activeTab === 'id_card' ? this.renderIdCardTab(roleDef, qrSvg) : ''}
          ${this.activeTab === 'edit_profile' ? this.renderEditProfileTab() : ''}
          ${this.activeTab === 'code_of_conduct' ? this.renderConductTab() : ''}
        </div>

      </div>
    `;

    this.bindEvents();
  }

  private renderIdCardTab(roleDef: any, qrSvg: string): string {
    const isProfileIncomplete = !this.profile.fullName || !this.profile.phone;

    return `
      ${
        isProfileIncomplete
          ? `
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300">
            <div>
              <div class="font-bold">Profiliniz Henüz Tamamlanmadı!</div>
              <div class="text-[11px] text-amber-200/80">Kriz masasında yetkilendirilmek için bilgilerinizi giriniz.</div>
            </div>
            <button id="btn-go-edit" class="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0">
              Profili Doldur
            </button>
          </div>
        `
          : ''
      }

      <!-- Badge Visual ID Card -->
      <div class="relative p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-zinc-900 to-black border-2 border-white/15 shadow-2xl text-white space-y-4 overflow-hidden">
        
        <!-- Watermark / Header line -->
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">${roleDef.icon}</span>
            <div>
              <div class="text-[9px] uppercase tracking-widest text-gray-400 font-mono">T.C. AFET GÖNÜLLÜ SAHRA KARTI</div>
              <div class="font-black text-sm tracking-wide text-white">${roleDef.title}</div>
            </div>
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider" style="background: ${roleDef.badgeColor}; color: #ffffff;">
              ${this.profile.availability === 'READY_NOW' ? 'GÖREVE HAZIR' : 'YEREL DESTEK'}
            </span>
          </div>
        </div>

        <!-- Identity and QR Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          <!-- Details Left (2 cols) -->
          <div class="sm:col-span-2 space-y-2.5">
            <div>
              <div class="text-[10px] text-gray-400 uppercase font-semibold">Gönüllü / Yetkili</div>
              <div class="text-base font-black text-white tracking-wide">
                ${this.profile.fullName.toUpperCase() || 'İSİMSİZ GÖNÜLLÜ'}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span class="text-[9px] text-gray-400 block">Kan Grubu</span>
                <span class="font-bold text-rose-400 text-sm">${this.profile.bloodGroup}</span>
              </div>
              <div class="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span class="text-[9px] text-gray-400 block">Şehir / Lokasyon</span>
                <span class="font-bold text-gray-200">${this.profile.city || 'Belirtilmedi'}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span class="text-[9px] text-gray-400 block">İletişim Tel</span>
                <span class="font-bold text-cyan-300 font-mono">${this.profile.phone || 'Girilmedi'}</span>
              </div>
              <div class="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span class="text-[9px] text-gray-400 block">T.C. Son 4</span>
                <span class="font-bold text-gray-200 font-mono">${this.profile.nationalIdLast4 ? `***${this.profile.nationalIdLast4}` : '----'}</span>
              </div>
            </div>

            ${
              this.profile.emergencyContact
                ? `
              <div class="text-[10px] text-gray-400">
                Acil Durum Yakını: <strong class="text-gray-200">${this.profile.emergencyContact}</strong>
              </div>
            `
                : ''
            }
          </div>

          <!-- Offline QR Code Right (1 col) -->
          <div class="flex flex-col items-center justify-center p-2 rounded-2xl bg-white shadow-inner">
            <div class="w-28 h-28 flex items-center justify-center text-black">
              ${qrSvg}
            </div>
            <div class="text-[8px] font-bold text-slate-800 uppercase tracking-widest mt-1 text-center font-mono">
              ÇEVRİMDISI SAHRA DOĞRULAMA
            </div>
          </div>

        </div>

        <!-- Required Gear Footnote -->
        <div class="pt-3 border-t border-white/10 text-[10px] text-gray-400">
          <strong class="text-white">Sahada Zorunlu Asgari KKD:</strong>
          ${roleDef.requiredGear.join(' • ')}
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        <button id="btn-copy-vol-sms" class="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.98]">
          ${Icons.copy('w-4 h-4')}
          AFAD / Kriz Masası SMS Metnini Kopyala
        </button>

        <button id="btn-share-vol-pass" class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
          ${Icons.share('w-4 h-4')}
          Kimlik Kartı Bilgilerini Paylaş
        </button>
      </div>
    `;
  }

  private renderEditProfileTab(): string {
    const bloods = ['Bilinmiyor', '0 RH+', '0 RH-', 'A RH+', 'A RH-', 'B RH+', 'B RH-', 'AB RH+', 'AB RH-'];
    const p = this.profile;

    return `
      <form id="form-edit-volunteer" class="space-y-4">
        
        <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
          <div class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>👤</span> Temel Kimlik & İletişim
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Adınız Soyadınız *</label>
              <input name="fullName" type="text" value="${p.fullName}" placeholder="Örn: Ahmet Yılmaz" required class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-400" />
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Telefon Numarası *</label>
              <input name="phone" type="tel" value="${p.phone}" placeholder="0532 123 4567" required class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-blue-400" />
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Kan Grubu</label>
              <select name="bloodGroup" class="w-full px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none">
                ${bloods.map((b) => `<option value="${b}" ${p.bloodGroup === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">İkamet Şehri</label>
              <input name="city" type="text" value="${p.city}" placeholder="Örn: İstanbul / Kadıköy" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">T.C. Kimlik No (Yalnızca Son 4 Hane)</label>
              <input name="nationalIdLast4" type="text" maxlength="4" value="${p.nationalIdLast4}" placeholder="1234" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono outline-none" />
              <div class="text-[9px] text-gray-500 mt-0.5">Güvenliğiniz için tam numaranız istenmez.</div>
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Acil Durum Yakını & Telefonu</label>
              <input name="emergencyContact" type="text" value="${p.emergencyContact}" placeholder="Örn: Eşim Ayşe - 0533..." class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
          <div class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎖️</span> Uzmanlık & Görev Dağılımı
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1.5">Asli Sahra Göreviniz / Uzmanlığınız</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${(Object.keys(VOLUNTEER_ROLES) as VolunteerSkillRole[]).map((r) => {
                const def = VOLUNTEER_ROLES[r];
                const isChecked = p.primaryRole === r;
                return `
                  <label class="flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-500/20 border-blue-500/60 text-white'
                      : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/[0.05]'
                  }">
                    <input type="radio" name="primaryRole" value="${r}" ${isChecked ? 'checked' : ''} class="mt-0.5 accent-blue-400" />
                    <div>
                      <div class="font-bold flex items-center gap-1.5">
                        <span>${def.icon}</span>
                        <span>${def.title}</span>
                      </div>
                      <div class="text-[10px] text-gray-400 leading-tight mt-0.5">${def.description}</div>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Deneyim / Yetkinlik Seviyesi</label>
              <select name="experienceLevel" class="w-full px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none">
                <option value="BEGINNER" ${p.experienceLevel === 'BEGINNER' ? 'selected' : ''}>Gönüllü / Başlangıç Seviye</option>
                <option value="INTERMEDIATE" ${p.experienceLevel === 'INTERMEDIATE' ? 'selected' : ''}>Saha Deneyimli (Daha önce görev aldı)</option>
                <option value="CERTIFIED_EXPERT" ${p.experienceLevel === 'CERTIFIED_EXPERT' ? 'selected' : ''}>Sertifikalı Uzman (AFAD / AKUT / INSARAG / TRAC)</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] text-gray-400 mb-1">Sahaya İntikal Durumu</label>
              <select name="availability" class="w-full px-2.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs outline-none">
                <option value="READY_NOW" ${p.availability === 'READY_NOW' ? 'selected' : ''}>Hemen Göreve Hazırım</option>
                <option value="WITHIN_24H" ${p.availability === 'WITHIN_24H' ? 'selected' : ''}>24 Saat İçinde Hazırlanabilirim</option>
                <option value="LOCAL_ONLY" ${p.availability === 'LOCAL_ONLY' ? 'selected' : ''}>Yalnızca Kendi Şehrimde Görev Alabilirim</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[10px] text-gray-400 mb-1">Varsa Sertifika & Ekipmanlar (Hilti, Jeneratör, Telsiz Çağrı İşareti vb.)</label>
            <input name="certifications" type="text" value="${p.certifications}" placeholder="Örn: TRAC Lisans No TA2XYZ, 5 kW Jeneratör, Hilti" class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none" />
          </div>
        </div>

        <button type="submit" class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all">
          ${Icons.checkCircle('w-4 h-4')}
          Sahra Kimlik Kartını Kaydet & QR Üret
        </button>

      </form>
    `;
  }

  private renderConductTab(): string {
    return `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
          <div class="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <span>⚠️</span> İnsani Yardım & Arama Kurtarma Sahra Kanunları
          </div>
          <div class="text-[11px] text-rose-200/90 leading-relaxed">
            Afet bölgesinde bireysel, koordinesiz hareket etmek yardım değil ek risk yaratır. Lütfen aşağıdaki INSARAG ve AFAD standart kurallarına harfiyen uyun.
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 text-[11px] text-gray-300">
          <div class="space-y-1">
            <strong class="text-white block">1. İzinsiz Enkaza Kesinlikle Girmeyin (Self-Deployment Yasaktır):</strong>
            <span>Kriz Masası veya USAR takım liderinin yazılı/sözlü görevlendirmesi olmadan hiçbir enkaza kendi inisiyatifinizle girmeyin. İkinci bir çökmede kurtarıcı değil kazazede konumuna düşersiniz.</span>
          </div>

          <div class="space-y-1">
            <strong class="text-white block">2. "Sessizlik!" Komutuna Mutlak İtaat:</strong>
            <span>Saha şefi megafonla "Sessizlik!" veya düdük çaldığında tüm makineler, jeneratörler ve konuşmalar ANINDA durdurulur. Enkaz altından gelen en ufak inilti veya vurma sesi dinlenir.</span>
          </div>

          <div class="space-y-1">
            <strong class="text-white block">3. Kendi Kendine Yetebilme (Self-Sufficiency):</strong>
            <span>Sahaya giden her gönüllü kendi 72 saatlik suyunu, kumanyasını, uyku tulumunu ve ilacını yanında taşımalıdır. Afetzedeye ayrılan kısıtlı kaynakları tüketmeyin.</span>
          </div>

          <div class="space-y-1">
            <strong class="text-white block">4. Kişisel Koruyucu Donanım (KKD) Olmadan Çalışmayın:</strong>
            <span>Baret, çelik burunlu iş botu, FFP3 toz maskesi ve deri eldiven olmadan enkaz veya enkaz etrafında bulunmak kesinlikle yasaktır. Asbest ve tetanos en büyük tehdittir.</span>
          </div>

          <div class="space-y-1">
            <strong class="text-white block">5. Fotoğraf ve Sosyal Medya Etiği:</strong>
            <span>Kurtarma anında kazazedelerin yüzünü, bedenini veya özel eşyalarını izinsiz fotoğraflamak/videoya almak etik dışıdır ve kriz yönetimini sekteye uğratır.</span>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const btnClose = this.container.querySelector('#btn-close-volunteer');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.hide());
    }

    const tabs = this.container.querySelectorAll('.btn-vol-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-tab') as any;
        if (t) {
          this.activeTab = t;
          this.render();
        }
      });
    });

    const btnGoEdit = this.container.querySelector('#btn-go-edit');
    if (btnGoEdit) {
      btnGoEdit.addEventListener('click', () => {
        this.activeTab = 'edit_profile';
        this.render();
      });
    }

    // Form submit
    const form = this.container.querySelector('#form-edit-volunteer') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);

        this.profile = {
          fullName: (fd.get('fullName') as string)?.trim() || '',
          phone: (fd.get('phone') as string)?.trim() || '',
          bloodGroup: (fd.get('bloodGroup') as string) || 'Bilinmiyor',
          city: (fd.get('city') as string)?.trim() || '',
          nationalIdLast4: (fd.get('nationalIdLast4') as string)?.trim() || '',
          primaryRole: (fd.get('primaryRole') as VolunteerSkillRole) || 'GENERAL_SUPPORT',
          experienceLevel: (fd.get('experienceLevel') as any) || 'BEGINNER',
          certifications: (fd.get('certifications') as string)?.trim() || '',
          emergencyContact: (fd.get('emergencyContact') as string)?.trim() || '',
          availability: (fd.get('availability') as any) || 'READY_NOW',
          hasVehicle: false,
          vehicleType: ''
        };

        volunteerDispatchService.saveProfile(this.profile);
        this.activeTab = 'id_card';
        this.render();
      });
    }

    // Copy SMS
    const btnCopySms = this.container.querySelector('#btn-copy-vol-sms');
    if (btnCopySms) {
      btnCopySms.addEventListener('click', () => {
        const text = volunteerDispatchService.generateCoordinationSms(this.profile);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnCopySms.innerHTML = `${Icons.checkCircle('w-4 h-4')} SMS Metni Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }

    // Share Pass
    const btnShare = this.container.querySelector('#btn-share-vol-pass');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        const text = volunteerDispatchService.generateQrPayload(this.profile);
        if (navigator.share) {
          navigator.share({
            title: `Afet Gönüllü Kimlik Kartı - ${this.profile.fullName}`,
            text: text
          }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          btnShare.innerHTML = `${Icons.checkCircle('w-4 h-4')} Kart Metni Kopyalandı!`;
          setTimeout(() => this.render(), 2000);
        }
      });
    }
  }
}

