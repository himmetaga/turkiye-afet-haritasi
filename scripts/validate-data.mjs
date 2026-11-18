// public/data altındaki yayın verisini doğrular. Hata varsa süreç 1 ile çıkar;
// böylece günlük senkron bozuk, eksik veya uydurma veriyi commit'leyemez ve
// CI build'i başarısız olur.
//
// Kullanım: node scripts/validate-data.mjs [--max-age-hours=48]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');

const MIN = { assembly: 20000, hospitals: 1000, pharmacies: 15000 };
const BBOX = { minLon: 25.5, maxLon: 44.8, minLat: 35.8, maxLat: 42.2 };
const ALLOWED_PHARMACY_SOURCES = new Set(['osm']);

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

function readJson(name) {
  const file = path.join(DATA, name);
  if (!fs.existsSync(file)) {
    fail(`${name} bulunamadı`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail(`${name} geçerli JSON değil: ${e.message}`);
    return null;
  }
}

function checkFeatures(name, fc) {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) {
    fail(`${name} bir GeoJSON FeatureCollection değil`);
    return [];
  }
  const ids = new Set();
  let outside = 0;
  let dupIds = 0;
  for (const f of fc.features) {
    const [lon, lat] = f?.geometry?.coordinates ?? [];
    if (
      typeof lon !== 'number' || typeof lat !== 'number' ||
      lon < BBOX.minLon || lon > BBOX.maxLon || lat < BBOX.minLat || lat > BBOX.maxLat
    ) outside++;
    const id = f?.id ?? f?.properties?.id;
    if (ids.has(id)) dupIds++;
    ids.add(id);
    if (!f?.properties?.name) fail(`${name}: adı olmayan kayıt (${id})`);
  }
  if (outside > 0) fail(`${name}: ${outside} kayıt Türkiye sınırları dışında veya koordinatsız`);
  if (dupIds > 0) fail(`${name}: ${dupIds} tekrarlanan id`);
  return fc.features;
}

/** Uydurma verinin tipik izleri: aynı adres/telefonun farklı kayıtlarda tekrar tekrar geçmesi. */
function checkFabricationPatterns(label, features) {
  const byAddress = new Map();
  const byPhone = new Map();
  for (const f of features) {
    const p = f.properties || {};
    const addr = (p.address || '').replace(/^[^,]*?\s(?=Merkez Mah\.)/, '').trim();
    // Yalnızca kapı numarası içeren adresler: farklı kayıtlarda aynı tam adres şablon işaretidir
    if (/\d/.test(addr)) byAddress.set(addr, (byAddress.get(addr) || 0) + 1);
    const phone = (p.phone || '').replace(/\D/g, '');
    if (phone.length >= 10) {
      const names = byPhone.get(phone) || new Set();
      names.add(p.name);
      byPhone.set(phone, names);
    }
  }
  const templated = [...byAddress.entries()].filter(([, n]) => n >= 25);
  for (const [addr, n] of templated.slice(0, 5)) {
    fail(`${label}: "${addr}" adresi ${n} farklı kayıtta geçiyor (şablonla üretilmiş veri şüphesi)`);
  }
  const sharedPhones = [...byPhone.entries()].filter(([, names]) => names.size >= 6);
  for (const [phone, names] of sharedPhones.slice(0, 5)) {
    warn(`${label}: ${phone} numarası ${names.size} farklı isimde kullanılıyor`);
  }
}

// --- Toplanma alanları ---
const assembly = checkFeatures('assembly-points.geojson', readJson('assembly-points.geojson'));
if (assembly.length < MIN.assembly) {
  fail(`Toplanma alanı sayısı ${assembly.length} (beklenen en az ${MIN.assembly})`);
}

// --- Acil tesisler ---
const facilities = checkFeatures('emergency-facilities.geojson', readJson('emergency-facilities.geojson'));
const hospitals = facilities.filter((f) => f.properties?.category === 'hospital');
const pharmacies = facilities.filter((f) => f.properties?.category === 'pharmacy');

if (hospitals.length < MIN.hospitals) {
  fail(`Hastane sayısı ${hospitals.length} (beklenen en az ${MIN.hospitals})`);
}
if (pharmacies.length < MIN.pharmacies) {
  fail(`Eczane sayısı ${pharmacies.length} (beklenen en az ${MIN.pharmacies})`);
}
const badSource = pharmacies.filter((f) => !ALLOWED_PHARMACY_SOURCES.has(f.properties?.source));
if (badSource.length > 0) {
  fail(`${badSource.length} eczanenin kaynağı doğrulanmış bir kaynak değil (izinli: ${[...ALLOWED_PHARMACY_SOURCES].join(', ')})`);
}
const staticDuty = pharmacies.filter((f) => f.properties?.isDuty);
if (staticDuty.length > 0) {
  fail(`${staticDuty.length} eczane statik veride "nöbetçi" işaretli; nöbet bilgisi yalnızca canlı resmi kaynaktan gelmeli`);
}
checkFabricationPatterns('eczaneler', pharmacies);
checkFabricationPatterns('hastaneler', hospitals);

// --- Özet ve tazelik ---
const summary = readJson('summary.json');
const maxAgeArg = process.argv.find((a) => a.startsWith('--max-age-hours='));
if (summary && maxAgeArg) {
  const maxAgeH = Number(maxAgeArg.split('=')[1]);
  const ageH = (Date.now() - Date.parse(summary.updatedAt)) / 3.6e6;
  if (!(ageH <= maxAgeH)) fail(`summary.json ${ageH.toFixed(1)} saat önce güncellenmiş (sınır ${maxAgeH} saat)`);
}
if (summary && summary.pharmaciesCount !== pharmacies.length) {
  fail(`summary.json eczane sayısı (${summary.pharmaciesCount}) dosyayla (${pharmacies.length}) uyuşmuyor`);
}

// --- Rapor ---
console.log(
  `[validate] toplanma: ${assembly.length}, hastane: ${hospitals.length}, eczane: ${pharmacies.length}`
);
for (const w of warnings) console.warn(`[validate] UYARI: ${w}`);
if (errors.length > 0) {
  for (const e of errors) console.error(`[validate] HATA: ${e}`);
  console.error(`[validate] ${errors.length} hata. Veri yayına alınmamalı.`);
  process.exit(1);
}
console.log('[validate] Veri doğrulandı.');
