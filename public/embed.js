/**
 * afet.live — 1-Satırlık Sitene Ekle Widget'ı (Embed Badge)
 * Kullanım:
 * <script src="https://afet.live/embed.js" data-il="istanbul" data-ilce="kadikoy" async></script>
 */
(function () {
  'use strict';

  // Find the executing script tag
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  const defaultIl = (currentScript && currentScript.getAttribute('data-il')) || 'istanbul';
  const defaultIlce = (currentScript && currentScript.getAttribute('data-ilce')) || 'kadikoy';
  const theme = (currentScript && currentScript.getAttribute('data-theme')) || 'dark';

  class AfetLiveBadge extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      const il = this.getAttribute('data-il') || defaultIl;
      const ilce = this.getAttribute('data-ilce') || defaultIlce;
      this.render(il, ilce);
      this.fetchLiveData(il);
    }

    async fetchLiveData(il) {
      try {
        const res = await fetch('https://afet.live/data/summary.json', { cache: 'no-cache' });
        if (!res.ok) return;
        const data = await res.json();
        const totalPoints = data.totalAssemblyPoints || 27331;
        const totalHospitals = data.totalHospitals || 1226;
        
        const countEl = this.shadowRoot.querySelector('#afet-points-count');
        if (countEl) {
          countEl.textContent = `${totalPoints.toLocaleString('tr-TR')} Toplanma Alanı`;
        }
      } catch (e) {
        // Fallback silently if offline or network error
      }
    }

    render(il, ilce) {
      const formattedIl = il.charAt(0).toUpperCase() + il.slice(1).toLowerCase();
      const formattedIlce = ilce.charAt(0).toUpperCase() + ilce.slice(1).toLowerCase();
      const targetUrl = `https://afet.live/?il=${encodeURIComponent(il)}&ilce=${encodeURIComponent(ilce)}`;

      const styles = `
        :host {
          display: inline-block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          box-sizing: border-box;
          max-width: 100%;
          text-decoration: none;
        }
        *, *::before, *::after {
          box-sizing: inherit;
        }
        .widget-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 16px;
          background: ${theme === 'light' ? '#ffffff' : '#090a0f'};
          color: ${theme === 'light' ? '#0f172a' : '#f8fafc'};
          border: 1px solid ${theme === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'};
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
          width: 320px;
          max-width: 100%;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .widget-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -5px rgba(0, 0, 0, 0.35);
        }
        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: -0.02em;
          color: ${theme === 'light' ? '#0f172a' : '#ffffff'};
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .location-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .location-title {
          font-weight: 700;
          font-size: 13.5px;
          color: ${theme === 'light' ? '#1e293b' : '#f1f5f9'};
        }
        .location-sub {
          font-size: 11px;
          color: ${theme === 'light' ? '#64748b' : '#94a3b8'};
        }
        .btn-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 10px;
          background: #10b981;
          color: #052e16;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .btn-action:hover {
          background: #34d399;
        }
        .widget-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          color: ${theme === 'light' ? '#94a3b8' : '#64748b'};
          padding-top: 4px;
          border-top: 1px solid ${theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)'};
        }
      `;

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="widget-card">
          <div class="widget-header">
            <div class="brand">
              <span class="pulse-dot"></span>
              <span>afet.live</span>
            </div>
            <span class="badge">CANLI RADAR</span>
          </div>
          <div class="location-info">
            <span class="location-title">📍 ${formattedIlce}, ${formattedIl}</span>
            <span id="afet-points-count" class="location-sub">27.331 Resmi Toplanma Alanı & Hastane</span>
          </div>
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="btn-action">
            <span>🛡️ En Yakın Toplanma Alanını Bul</span>
          </a>
          <div class="widget-footer">
            <span>ACİL ÇAĞRI: 112 • AFAD: 122</span>
            <span>afet.live</span>
          </div>
        </div>
      `;
    }
  }

  // Register Custom Web Component if not already defined
  if (!customElements.get('afet-live-badge')) {
    customElements.define('afet-live-badge', AfetLiveBadge);
  }

  // Auto-inject badge after the script element if no existing badge element is on the host page
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('afet-live-badge')) {
      const badge = document.createElement('afet-live-badge');
      badge.setAttribute('data-il', defaultIl);
      badge.setAttribute('data-ilce', defaultIlce);
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(badge, currentScript.nextSibling);
      }
    }
  });
})();
