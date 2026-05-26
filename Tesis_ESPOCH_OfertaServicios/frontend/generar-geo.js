const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/geo/cantones.geojson', 'utf8'));

const provMap = {};
data.features.forEach(f => {
  const prov = f.properties.DPA_DESPRO;
  if (!provMap[prov]) {
    provMap[prov] = {
      type: 'Feature',
      properties: { DPA_DESPRO: prov, DPA_PROVIN: f.properties.DPA_PROVIN },
      geometry: { type: 'GeometryCollection', geometries: [] }
    };
  }
  provMap[prov].geometry.geometries.push(f.geometry);
});

const provinciales = { type: 'FeatureCollection', features: Object.values(provMap) };
const ecuador = { type: 'FeatureCollection', features: data.features };

fs.writeFileSync('./public/geo/provinciales.geojson', JSON.stringify(provinciales));
fs.writeFileSync('./public/geo/ecuador.geojson', JSON.stringify(ecuador));

console.log('Listo! Provincias:', Object.keys(provMap).length);