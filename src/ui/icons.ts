export const Icons = {
  compass: (className = 'w-4 h-4', angle = 0) => `
    <svg class="${className}" style="transform: rotate(${angle}deg);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
    </svg>
  `,
  crosshair: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="22" y1="12" x2="18" y2="12"></line>
      <line x1="6" y1="12" x2="2" y2="12"></line>
      <line x1="12" y1="6" x2="12" y2="2"></line>
      <line x1="12" y1="22" x2="12" y2="18"></line>
    </svg>
  `,
  water: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
    </svg>
  `,
  bolt: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `,
  tent: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 20L12 4L5 20"></path>
      <path d="M12 4v16"></path>
      <path d="M5 20h14"></path>
      <path d="M9 20l3-6 3 6"></path>
    </svg>
  `,
  generator: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2"></rect>
      <path d="M6 3v4"></path>
      <path d="M18 3v4"></path>
      <circle cx="12" cy="13.5" r="3.5"></circle>
    </svg>
  `,
  whistle: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 13a7 7 0 0 0 12.3 4.5l5.2-5.2a2 2 0 0 0 0-2.8l-1.5-1.5a2 2 0 0 0-2.8 0L12.5 11.7A7 7 0 0 0 3 13z"></path>
      <circle cx="9" cy="13" r="2"></circle>
      <path d="M18 4l2 2"></path>
      <path d="M21 7l1 1"></path>
    </svg>
  `,
  offlineCloud: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
      <path d="M12 12v9"></path>
      <path d="M8 17l4 4 4-4"></path>
    </svg>
  `,
  checkCircle: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  `,
  seismic: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="2 12 6 12 9 3 13 21 17 9 20 12 22 12"></polyline>
    </svg>
  `,
  search: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,
  share: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
      <polyline points="16 6 12 2 8 6"></polyline>
      <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
  `,
  copy: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `,
  close: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `,
  shield: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  `,
  layers: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
      <polyline points="2 17 12 22 22 17"></polyline>
      <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
  `,
  walking: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M10 22l2-7 3 3v6"></path>
      <path d="M14 13l2-3-4-2-2 3"></path>
    </svg>
  `,
  wifi: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  `,
  wifiOff: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  `,
  navigation: (className = 'w-4 h-4') => `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
    </svg>
  `
};
