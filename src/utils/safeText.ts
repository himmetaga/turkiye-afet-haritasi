/**
 * Dış kaynaklı metinleri HTML'e güvenle yazmak için yardımcılar.
 *
 * Uygulama arayüzü büyük ölçüde template string + innerHTML ile çizilir.
 * Toplanma alanı, tesis, eczane (OpenStreetMap, açık veri API'leri) ve
 * Nostr sohbet mesajları üçüncü kişilerce değiştirilebilir; bu metinler
 * HTML'e yazılmadan önce mutlaka bu yardımcılardan geçmelidir.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/** Metni HTML metni veya tırnaklı öznitelik içinde güvenle kullanılabilir hale getirir. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Veri yüklenirken kullanılır: HTML'e dönüşebilecek karakterleri zararsız
 * benzerleriyle değiştirir. Harita etiketlerinde de görünen veride entity
 * (&amp; gibi) kullanılamadığı için kaçışlama yerine bu yol seçildi.
 */
export function sanitizeExternalText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/</g, '‹')
    .replace(/>/g, '›')
    .replace(/"/g, '”')
    .replace(/'/g, '’')
    .replace(/`/g, '’');
}

/** Bir kaydın tüm üst düzey metin alanlarını sanitizeExternalText'ten geçirir. */
export function sanitizeRecordStrings<T extends object>(record: T): T {
  const out: Record<string, unknown> = { ...(record as Record<string, unknown>) };
  for (const [key, val] of Object.entries(out)) {
    if (typeof val === 'string') out[key] = sanitizeExternalText(val);
  }
  return out as T;
}
