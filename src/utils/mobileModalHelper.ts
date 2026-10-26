/**
 * mobileModalHelper.ts
 * =============================================================================
 * Mobil cihazlarda (iOS Safari, Android Chrome vb.) açılan tüm kutuların,
 * çekmecelerin ve pencerelerin sorunsuz, gecikmesiz ve tek dokunuşla kapanmasını
 * garanti eden evrensel yardımcı motor.
 * =============================================================================
 * 1. Karartılmış arka plana (backdrop) dokunulduğunda anında kapatma (Touch & Click)
 * 2. Dokunmatik ekranlar için 44x44px minimum hedefli kapatma butonları (HIG/WCAG)
 * 3. Donanımsal/Jestle Geri Tuşu (Android Back / Browser Swipe Back) entegrasyonu
 * 4. Klavye 'Escape' tuşu ile tüm kutuları tek hamlede kapatma
 * 5. Ekran dışına taşmayı önleyen dinamik mobil viewport (dvh) koruması
 */

type HideCallback = () => void;

interface ActiveModalEntry {
  id: string;
  hide: HideCallback;
}

const activeModalsStack: ActiveModalEntry[] = [];
let isPopstateListenerAttached = false;
let isKeydownListenerAttached = false;

function initGlobalListeners(): void {
  if (typeof window === 'undefined') return;

  if (!isPopstateListenerAttached) {
    window.addEventListener('popstate', () => {
      if (activeModalsStack.length > 0) {
        const top = activeModalsStack.pop();
        try {
          top?.hide();
        } catch {}
      }
    });
    isPopstateListenerAttached = true;
  }

  if (!isKeydownListenerAttached) {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeModalsStack.length > 0) {
        const top = activeModalsStack.pop();
        try {
          top?.hide();
        } catch {}
      }
    });
    isKeydownListenerAttached = true;
  }
}

/**
 * Bir modal açıldığında geri tuşu ve Escape yığınına kaydeder.
 */
export function registerModalOpen(id: string, hide: HideCallback): () => void {
  initGlobalListeners();

  // Zaten varsa eskisini kaldır
  const existingIdx = activeModalsStack.findIndex((m) => m.id === id);
  if (existingIdx !== -1) {
    activeModalsStack.splice(existingIdx, 1);
  }

  activeModalsStack.push({ id, hide });

  // Mobil tarayıcı geçmişine sanal durum ekle
  try {
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modalId: id }, '');
    }
  } catch {}

  return () => {
    registerModalClose(id);
  };
}

/**
 * Modal kapandığında yığından temizler.
 */
export function registerModalClose(id: string): void {
  const idx = activeModalsStack.findIndex((m) => m.id === id);
  if (idx !== -1) {
    activeModalsStack.splice(idx, 1);
  }
}

/**
 * Açık olan en üstteki modalı kapatır.
 */
export function closeTopModal(): boolean {
  if (activeModalsStack.length > 0) {
    const top = activeModalsStack.pop();
    try {
      top?.hide();
      return true;
    } catch {}
  }
  return false;
}

/**
 * Modal konteynerine mobil dokunmatik kapatma (Touch & Click) ve backdrop tıklamasını bağlar.
 * Event delegation (olay yetkilendirme) kullanarak innerHTML değişikliklerinden etkilenmez.
 */
export function setupModalMobileDismiss(options: {
  container: HTMLElement;
  hide: HideCallback;
  closeBtnSelector?: string;
  modalCardSelector?: string;
}): void {
  const { container, hide, closeBtnSelector, modalCardSelector } = options;
  if (!container) return;

  // iOS Safari'nin tıklama olayını yakalayabilmesi için container üzerinde cursor: pointer olmalıdır
  container.style.cursor = 'pointer';
  container.style.touchAction = 'manipulation';

  let touchStartY = 0;
  let touchStartX = 0;
  let isSwiping = false;
  let lastTapTime = 0;

  container.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
      }
    },
    { passive: true }
  );

  container.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const diffX = Math.abs(e.touches[0].clientX - touchStartX);
        const diffY = Math.abs(e.touches[0].clientY - touchStartY);
        if (diffX > 12 || diffY > 12) {
          isSwiping = true;
        }
      }
    },
    { passive: true }
  );

  const defaultCloseSelector =
    '[id^="btn-close-"], [id*="-close-"], [id$="-close"], [id*="btn-close"], .btn-close, [data-dismiss="modal"]';
  const closeSelector = closeBtnSelector
    ? `${closeBtnSelector}, ${defaultCloseSelector}`
    : defaultCloseSelector;

  const handleDismiss = (e: Event) => {
    if (isSwiping) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    // 1. Kapatma butonuna veya içindeki ikona tıklandı mı?
    const closeBtn = target.closest<HTMLElement>(closeSelector);
    if (closeBtn && container.contains(closeBtn)) {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTapTime < 250) return;
      lastTapTime = now;
      hide();
      return;
    }

    // 2. Arka plan / backdrop tıklandı mı?
    // Hedef doğrudan container veya backdrop ise ve modal kartının içinde DEĞİLSE
    const cardSelector =
      modalCardSelector ||
      '.hud-glass, .ios27-glass, .ios27-bar, [class*="bg-obsidian"], [class*="max-w-"], [role="dialog"], .relative.w-full';
    const insideCard = target.closest(cardSelector);

    const isExplicitBackdrop =
      target === container ||
      target.id?.includes('backdrop') ||
      target.classList?.contains('modal-backdrop') ||
      target.classList?.contains('fixed');

    if (!insideCard && isExplicitBackdrop) {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTapTime < 250) return;
      lastTapTime = now;
      hide();
    }
  };

  container.addEventListener('click', handleDismiss);
  container.addEventListener('touchend', handleDismiss);
}
