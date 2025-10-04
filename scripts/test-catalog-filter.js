const fs = require('fs');
const path = require('path');

const FILE = path.resolve('mocks', 'printful-catalog-full.json');
const IN_STOCK = new Set(['in_stock', 'stocked_on_demand']);

const REGION_PRIORITY = {
  US: ['US'],
  CA: ['CA', 'US'],
  BR: ['BR', 'US'],
  MX: ['US', 'CA'],
  AU: ['AU', 'US'],
  NZ: ['AU', 'US'],
  JP: ['JP', 'US'],
  CN: ['CN', 'US'],
  GB: ['UK', 'EU'],
  UK: ['UK', 'EU'],
  ES: ['EU_ES', 'EU'],
  FR: ['EU', 'EU_ES'],
  IT: ['EU'],
  PT: ['EU'],
  DE: ['EU'],
  NL: ['EU'],
  BE: ['EU'],
  LV: ['EU_LV', 'EU'],
};
const REGION_FALLBACK = ['EU_ES', 'EU', 'US'];

function resolveRegions(country) {
  const c = String(country || 'ES').toUpperCase();
  return REGION_PRIORITY[c] || REGION_FALLBACK;
}

function coerceStr(v){
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}
function coerceNum(v){
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') { const n = Number.parseFloat(v); return Number.isFinite(n) ? n : null; }
  return null;
}

function normalizeVariant(raw){
  if (!raw) return null;
  const id = Number(raw.id ?? raw.variant_id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const availability = Array.isArray(raw.availability_status)
    ? raw.availability_status
        .map((e)=>({ region: coerceStr(e?.region)?.toUpperCase(), status: coerceStr(e?.status)?.toLowerCase() }))
        .filter((e)=>e.region && e.status)
    : [];
  const regionSet = new Set();
  if (raw.availability_regions && typeof raw.availability_regions === 'object') {
    Object.keys(raw.availability_regions).forEach((k)=>{ const x=coerceStr(k)?.toUpperCase(); if (x) regionSet.add(x); });
  }
  if (Array.isArray(raw.available_regions)) raw.available_regions.forEach((k)=>{ const x=coerceStr(k)?.toUpperCase(); if (x) regionSet.add(x); });
  if (Array.isArray(raw.availableRegions)) raw.availableRegions.forEach((k)=>{ const x=coerceStr(k)?.toUpperCase(); if (x) regionSet.add(x); });
  availability.forEach(({region})=>regionSet.add(region));
  const price = coerceNum(raw.price ?? raw.variant_price ?? raw.retail_price);
  const inStock = Boolean(raw.in_stock) || availability.some((a)=>IN_STOCK.has(a.status));
  return {
    id,
    size: coerceStr(raw.size) || null,
    color: coerceStr(raw.color) || coerceStr(raw.color_name) || null,
    colorCode: (coerceStr(raw.color_code || raw.color_code2)?.toLowerCase()) || null,
    price,
    image: coerceStr(raw.product_image) || coerceStr(raw.image) || coerceStr(raw.preview_url) || null,
    inStock,
    availability,
    availableRegions: Array.from(regionSet),
  };
}

function normalizeProduct(raw){
  const id = Number(raw.productId ?? raw.id ?? raw.product_id ?? raw.templateId ?? raw.template_id);
  if (!Number.isFinite(id) || id<=0) return null;
  const name = coerceStr(raw.name) || coerceStr(raw.title) || [coerceStr(raw.brand), coerceStr(raw.model)||coerceStr(raw.type)].filter(Boolean).join(' ') || `Producto ${id}`;
  const type = coerceStr(raw.producto) || coerceStr(raw.type_name) || coerceStr(raw.type) || null;
  const brand = coerceStr(raw.brand);
  const image = coerceStr(raw.image) || coerceStr(raw.preview) || coerceStr(raw.thumbnail) || (Array.isArray(raw.images)&&raw.images.length ? coerceStr(raw.images[0]?.url ?? raw.images[0]) : null);
  const variants = Array.isArray(raw.variants) ? raw.variants.map(normalizeVariant).filter(Boolean) : [];
  const files = Array.isArray(raw.files) ? raw.files : [];
  const placements = files.map((f)=>({ id: (coerceStr(f.placement||f.type||f.id||f.title)||'').toLowerCase(), label: coerceStr(f.title||f.label||f.type||f.id||f.placement)||'', additionalPrice: coerceNum(f.additional_price ?? f.additionalPrice ?? null) }));
  return { id, name, type, brand, image, variants, placements };
}

function filterByCountry(items, country, typeFilter){
  const regions = resolveRegions(country);
  const out = [];
  for (const p of items){
    if (typeFilter && (p.type||'').toLowerCase() !== String(typeFilter).toLowerCase()) continue;
    const variants = [];
    for (const v of p.variants){
      let matched = false, matchedRegion = null;
      for (const r of regions){
        const a = v.availability.find((e)=>e.region===r);
        if (a && IN_STOCK.has(a.status)) { matched = true; matchedRegion = r; break; }
        if (v.availableRegions.includes(r) && v.inStock){ matched = true; matchedRegion = r; break; }
      }
      if (matched) variants.push({ ...v, matchedRegion });
    }
    if (!variants.length) continue;
    const prices = variants.map(v=>v.price).filter((n)=>typeof n==='number' && Number.isFinite(n));
    const priceMin = prices.length ? Math.min(...prices) : null;
    const priceMax = prices.length ? Math.max(...prices) : null;
    const colorsMap = new Map();
    const sizesSet = new Set();
    for (const v of variants){
      if (v.color){ const k=(v.colorCode||v.color).toLowerCase(); if(!colorsMap.has(k)) colorsMap.set(k,{name:v.color, code:v.colorCode}); }
      if (v.size){ sizesSet.add(v.size.toUpperCase()); }
    }
    out.push({ ...p, variants, priceMin, priceMax, colors: Array.from(colorsMap.values()), sizes: Array.from(sizesSet.values()) });
  }
  out.sort((a,b)=>{
    const ap = typeof a.priceMin==='number' ? a.priceMin : Infinity;
    const bp = typeof b.priceMin==='number' ? b.priceMin : Infinity;
    return ap!==bp ? ap-bp : a.name.localeCompare(b.name);
  });
  return out;
}

function run(country, type){
  const data = JSON.parse(fs.readFileSync(FILE,'utf8'));
  const raw = Array.isArray(data.items) ? data.items : (Array.isArray(data.products) ? data.products : []);
  const items = raw.map(normalizeProduct).filter(Boolean);
  const filtered = filterByCountry(items, country, type);
  console.log(`Country=${country} type=${type||'-'} total=${filtered.length}`);
  console.log(filtered.slice(0,10).map(p=>({id:p.id, name:p.name, type:p.type, priceMin:p.priceMin}))); 
}

if (require.main === module){
  run(process.argv[2]||'ES', process.argv[3]||'');
}
