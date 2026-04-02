import { readFileSync, writeFileSync } from 'fs';

const old = JSON.parse(readFileSync('./src/lib/AAR/locations.json', 'utf8'));
const newData = JSON.parse(readFileSync('./src/lib/AAR/locations-new.json', 'utf8'));

const newNames = new Set();
for (const sys of Object.values(newData.systems)) {
  for (const n of sys.jumpPointStations || []) newNames.add(n.toLowerCase());
  for (const planet of Object.values(sys.planets)) {
    for (const k of ['landingZones', 'settlements', 'stations', 'lagrangeStations', 'pois']) {
      for (const n of planet[k] || []) newNames.add(n.toLowerCase());
    }
    for (const moon of Object.values(planet.moons || {})) {
      for (const n of moon.pois || []) newNames.add(n.toLowerCase());
      for (const n of moon.stations || []) newNames.add(n.toLowerCase());
    }
  }
}

const missing = old.filter(loc => {
  const clean = loc.name.toLowerCase().trim().replace(/^"|"$/g, '');
  const raw = loc.name.toLowerCase().trim();
  return !newNames.has(clean) && !newNames.has(raw);
});

writeFileSync('./src/lib/AAR/locations-missing.json', JSON.stringify(missing, null, 2));
console.log(`old: ${old.length}, new unique: ${newNames.size}, missing: ${missing.length}`);
