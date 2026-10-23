import fs from 'node:fs';

const RED = '#E01E2E';
const NAVY = '#0C1527';

export function getEmblemSvg(size = 512, isDark = true) {
  const textColor = isDark ? '#FFFFFF' : NAVY;
  const bgColor = isDark ? 'transparent' : '#FFFFFF';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="${size}" height="${size}" fill="none">
  <!-- Red Pin Upper Body -->
  <path d="M 140 195 
           A 110 110 0 0 1 360 195 
           C 360 225 348 252 328 274 
           L 300 248 
           C 316 233 325 215 325 195 
           A 75 75 0 0 0 175 195 
           C 175 215 184 233 200 248 
           L 172 274 
           C 152 252 140 225 140 195 Z" 
        fill="${RED}" />

  <!-- Seismic Pulse (ECG Waveform) -->
  <path d="M 175 195 
           L 204 195 
           L 216 156 
           L 230 236 
           L 245 120 
           L 260 234 
           L 272 162 
           L 282 208 
           L 290 195 
           L 325 195" 
        stroke="${RED}" 
        stroke-width="11" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Chimney on Right Slope -->
  <path d="M 285 248 L 285 222 L 302 222 L 302 263 Z" fill="${NAVY}" />

  <!-- Gable Roof Slab -->
  <path d="M 250 216 
           L 334 278 
           L 322 293 
           L 250 240 
           L 178 293 
           L 166 278 Z" 
        fill="${NAVY}" />

  <!-- 4 Window Panes (2x2 Grid) -->
  <rect x="237" y="260" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
  <rect x="252.5" y="260" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
  <rect x="237" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
  <rect x="252.5" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />

  <!-- Red Pin Bottom Point (Chevron) -->
  <path d="M 182 308 
           L 250 258 
           L 318 308 
           L 250 398 Z" 
        fill="${RED}" />
</svg>`;
}

export function getFullLogoSvg(width = 600, height = 720) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720" width="${width}" height="${height}" fill="none">
  <!-- Brand Emblem -->
  <g transform="translate(50, 20)">
    <!-- Red Pin Upper Body -->
    <path d="M 140 195 
             A 110 110 0 0 1 360 195 
             C 360 225 348 252 328 274 
             L 300 248 
             C 316 233 325 215 325 195 
             A 75 75 0 0 0 175 195 
             C 175 215 184 233 200 248 
             L 172 274 
             C 152 252 140 225 140 195 Z" 
          fill="${RED}" />

    <!-- Seismic Waveform -->
    <path d="M 175 195 L 204 195 L 216 156 L 230 236 L 245 120 L 260 234 L 272 162 L 282 208 L 290 195 L 325 195" 
          stroke="${RED}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Chimney -->
    <path d="M 285 248 L 285 222 L 302 222 L 302 263 Z" fill="${NAVY}" />

    <!-- Gable Roof -->
    <path d="M 250 216 L 334 278 L 322 293 L 250 240 L 178 293 L 166 278 Z" fill="${NAVY}" />

    <!-- Window Panes -->
    <rect x="237" y="260" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
    <rect x="252.5" y="260" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
    <rect x="237" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />
    <rect x="252.5" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${NAVY}" />

    <!-- Red Bottom Chevron -->
    <path d="M 182 308 L 250 258 L 318 308 L 250 398 Z" fill="${RED}" />
  </g>

  <!-- Typography: afet.live -->
  <g transform="translate(300, 520)" text-anchor="middle">
    <text font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="96" letter-spacing="-2px">
      <tspan fill="${NAVY}">afet.</tspan><tspan fill="${RED}">live</tspan>
    </text>
  </g>
</svg>`;
}

export function getHorizontalLogoSvg(width = 300, height = 64, isDark = true) {
  const brandTextFill = isDark ? '#FFFFFF' : NAVY;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" width="${width}" height="${height}" fill="none">
  <!-- Compact Icon (Left) -->
  <g transform="translate(-18, -35) scale(0.24)">
    <path d="M 140 195 A 110 110 0 0 1 360 195 C 360 225 348 252 328 274 L 300 248 C 316 233 325 215 325 195 A 75 75 0 0 0 175 195 C 175 215 184 233 200 248 L 172 274 C 152 252 140 225 140 195 Z" fill="${RED}" />
    <path d="M 175 195 L 204 195 L 216 156 L 230 236 L 245 120 L 260 234 L 272 162 L 282 208 L 290 195 L 325 195" stroke="${RED}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 285 248 L 285 222 L 302 222 L 302 263 Z" fill="${isDark ? '#38BDF8' : NAVY}" />
    <path d="M 250 216 L 334 278 L 322 293 L 250 240 L 178 293 L 166 278 Z" fill="${isDark ? '#F1F5F9' : NAVY}" />
    <rect x="237" y="260" width="10.5" height="10.5" rx="1.5" fill="${isDark ? '#F1F5F9' : NAVY}" />
    <rect x="252.5" y="260" width="10.5" height="10.5" rx="1.5" fill="${isDark ? '#F1F5F9' : NAVY}" />
    <rect x="237" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${isDark ? '#F1F5F9' : NAVY}" />
    <rect x="252.5" y="275.5" width="10.5" height="10.5" rx="1.5" fill="${isDark ? '#F1F5F9' : NAVY}" />
    <path d="M 182 308 L 250 258 L 318 308 L 250 398 Z" fill="${RED}" />
  </g>

  <!-- Typography (Right) -->
  <text x="76" y="44" font-family="'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="34" letter-spacing="-1px">
    <tspan fill="${brandTextFill}">afet.</tspan><tspan fill="${RED}">live</tspan>
  </text>
</svg>`;
}

fs.writeFileSync('public/icon.svg', getEmblemSvg(512, false), 'utf-8');
fs.writeFileSync('public/favicon.svg', getEmblemSvg(64, false), 'utf-8');
fs.writeFileSync('public/logo.svg', getFullLogoSvg(600, 720), 'utf-8');
fs.writeFileSync('public/logo-horizontal.svg', getHorizontalLogoSvg(320, 64, true), 'utf-8');
fs.writeFileSync('public/icons/icon-192.svg', getEmblemSvg(192, false), 'utf-8');
fs.writeFileSync('public/icons/icon-512.svg', getEmblemSvg(512, false), 'utf-8');
console.log('Logos and PWA icons successfully regenerated!');
