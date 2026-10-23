import fs from 'node:fs';

const RED = '#E01E2E';
const NAVY = '#0C1728';

// Mathematically perfect, symmetrical, zero-distortion AFET.LIVE Emblem (1000x1000)
export function getEmblemSvg(isDark = false) {
  const roofColor = isDark ? '#FFFFFF' : NAVY;
  const windowColor = isDark ? '#FFFFFF' : NAVY;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%" fill="none">
  <!-- Outer Pin Upper Arc & Teardrop Body -->
  <!-- Top arc from left tangent (369.2, 497.8) to right tangent (630.8, 497.8) with R=190 -->
  <path d="M 369.2 497.8
           A 190 190 0 1 1 630.8 497.8
           L 500 636
           Z"
        fill="${RED}" />

  <!-- Inner Circle Cutout (Center 500, 360, R=135) -->
  <circle cx="500" cy="360" r="135" fill="${isDark ? '#090A0F' : '#FFFFFF'}" />

  <!-- Symmetrical Seismic Waveform (Centered along Y=360) -->
  <path d="M 345 360
           L 422 360
           L 444 282
           L 466 414
           L 492 224
           L 520 410
           L 546 294
           L 568 372
           L 582 360
           L 655 360"
        stroke="${RED}"
        stroke-width="18"
        stroke-linecap="round"
        stroke-linejoin="round" />

  <!-- House Gable Roof with Right Chimney -->
  <!-- Chimney on right roof slope -->
  <path d="M 554 456 L 554 430 L 582 430 L 582 480 Z" fill="${roofColor}" />

  <!-- Gable Roof Slab (Apex at 500, 434) -->
  <path d="M 500 434
           L 628 534
           L 610 556
           L 500 470
           L 390 556
           L 372 534
           Z"
        fill="${roofColor}" />

  <!-- Interior House White Area Under Roof -->
  <path d="M 500 475
           L 606 558
           L 500 626
           L 394 558
           Z"
        fill="${isDark ? '#090A0F' : '#FFFFFF'}" />

  <!-- 4 Square Window Panes (2x2 Matrix) -->
  <rect x="487" y="498" width="18" height="18" rx="2.5" fill="${windowColor}" />
  <rect x="509" y="498" width="18" height="18" rx="2.5" fill="${windowColor}" />
  <rect x="487" y="520" width="18" height="18" rx="2.5" fill="${windowColor}" />
  <rect x="509" y="520" width="18" height="18" rx="2.5" fill="${windowColor}" />

  <!-- Red V-Chevron Below Windows (Parallel to Pin Tip) -->
  <path d="M 404 556
           L 500 618
           L 596 556
           L 606 568
           L 500 636
           L 394 568
           Z"
        fill="${RED}" />
</svg>`;
}

// Full Brand Logo with centered text below (for OG Image, Splash, About)
export function getFullLogoSvg(width = 600, height = 700) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1100" width="${width}" height="${height}" fill="none">
  <!-- Brand Emblem -->
  <!-- Outer Pin Upper Arc & Teardrop Body -->
  <path d="M 369.2 497.8
           A 190 190 0 1 1 630.8 497.8
           L 500 636
           Z"
        fill="${RED}" />

  <!-- Inner Circle Cutout (Center 500, 360, R=135) -->
  <circle cx="500" cy="360" r="135" fill="#FFFFFF" />

  <!-- Symmetrical Seismic Waveform -->
  <path d="M 345 360
           L 422 360
           L 444 282
           L 466 414
           L 492 224
           L 520 410
           L 546 294
           L 568 372
           L 582 360
           L 655 360"
        stroke="${RED}"
        stroke-width="18"
        stroke-linecap="round"
        stroke-linejoin="round" />

  <!-- House Gable Roof with Chimney -->
  <path d="M 554 456 L 554 430 L 582 430 L 582 480 Z" fill="${NAVY}" />
  <path d="M 500 434
           L 628 534
           L 610 556
           L 500 470
           L 390 556
           L 372 534
           Z"
        fill="${NAVY}" />

  <!-- Interior House Area -->
  <path d="M 500 475
           L 606 558
           L 500 626
           L 394 558
           Z"
        fill="#FFFFFF" />

  <!-- 4 Square Window Panes -->
  <rect x="487" y="498" width="18" height="18" rx="2.5" fill="${NAVY}" />
  <rect x="509" y="498" width="18" height="18" rx="2.5" fill="${NAVY}" />
  <rect x="487" y="520" width="18" height="18" rx="2.5" fill="${NAVY}" />
  <rect x="509" y="520" width="18" height="18" rx="2.5" fill="${NAVY}" />

  <!-- Red V-Chevron -->
  <path d="M 404 556
           L 500 618
           L 596 556
           L 606 568
           L 500 636
           L 394 568
           Z"
        fill="${RED}" />

  <!-- Brand Typography: afet.live -->
  <text x="500" y="800" text-anchor="middle" font-family="'Outfit', 'Montserrat', -apple-system, sans-serif" font-weight="900" font-size="140" letter-spacing="-3px">
    <tspan fill="${NAVY}">afet.</tspan><tspan fill="${RED}">live</tspan>
  </text>
</svg>`;
}

// Crisp Horizontal Header Logo (for dark UI HUD - exactly sized, zero clipping)
export function getHorizontalLogoSvg(width = 240, height = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" width="${width}" height="${height}" fill="none">
  <!-- Scaled Emblem at Left: Centered inside 44x44 box with 0 clipping -->
  <g transform="translate(21, 2) scale(0.0944) translate(-500, -170)">
    <!-- Outer Pin Upper Arc & Teardrop Body -->
    <path d="M 369.2 497.8
             A 190 190 0 1 1 630.8 497.8
             L 500 636
             Z"
          fill="${RED}" />

    <!-- Inner Circle Cutout -->
    <circle cx="500" cy="360" r="135" fill="#0C1527" />

    <!-- Seismic Waveform -->
    <path d="M 345 360
             L 422 360
             L 444 282
             L 466 414
             L 492 224
             L 520 410
             L 546 294
             L 568 372
             L 582 360
             L 655 360"
          stroke="${RED}"
          stroke-width="20"
          stroke-linecap="round"
          stroke-linejoin="round" />

    <!-- House Roof -->
    <path d="M 554 456 L 554 430 L 582 430 L 582 480 Z" fill="#FFFFFF" />
    <path d="M 500 434
             L 628 534
             L 610 556
             L 500 470
             L 390 556
             L 372 534
             Z"
          fill="#FFFFFF" />

    <!-- Interior House Area -->
    <path d="M 500 475
             L 606 558
             L 500 626
             L 394 558
             Z"
          fill="#0C1527" />

    <!-- Windows -->
    <rect x="487" y="498" width="18" height="18" rx="2.5" fill="#FFFFFF" />
    <rect x="509" y="498" width="18" height="18" rx="2.5" fill="#FFFFFF" />
    <rect x="487" y="520" width="18" height="18" rx="2.5" fill="#FFFFFF" />
    <rect x="509" y="520" width="18" height="18" rx="2.5" fill="#FFFFFF" />

    <!-- Red V-Chevron -->
    <path d="M 404 556
             L 500 618
             L 596 556
             L 606 568
             L 500 636
             L 394 568
             Z"
          fill="${RED}" />
  </g>

  <!-- Typography at right -->
  <text x="48" y="34" font-family="'Outfit', -apple-system, sans-serif" font-weight="900" font-size="30" letter-spacing="-0.8px">
    <tspan fill="#FFFFFF">afet.</tspan><tspan fill="${RED}">live</tspan>
  </text>
</svg>`;
}

fs.writeFileSync('public/icon.svg', getEmblemSvg(false), 'utf-8');
fs.writeFileSync('public/favicon.svg', getEmblemSvg(false), 'utf-8');
fs.writeFileSync('public/logo.svg', getFullLogoSvg(600, 700), 'utf-8');
fs.writeFileSync('public/logo-horizontal.svg', getHorizontalLogoSvg(240, 48), 'utf-8');
fs.writeFileSync('public/icons/icon-192.svg', getEmblemSvg(false), 'utf-8');
fs.writeFileSync('public/icons/icon-512.svg', getEmblemSvg(false), 'utf-8');
console.log('Mathematically symmetrical vector logos generated successfully!');
