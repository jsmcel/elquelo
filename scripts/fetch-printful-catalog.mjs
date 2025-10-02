
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.replace(/\r/g, '');
    if (!line || line.trim().startsWith('#')) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const API_URL = process.env.PRINTFUL_API_BASE || 'https://api.printful.com';
const API_KEY = process.env.PRINTFUL_API_KEY;

if (!API_KEY) {
  console.error('PRINTFUL_API_KEY no esta configurada.');
  process.exit(1);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fetcher = url.startsWith('https') ? https : http;
    const req = fetcher.request(url, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function fetchPage(limit, offset) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) }).toString();
  const response = await request(`${API_URL}/products?${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Printful devolvio ${response.status}: ${response.body}`);
  }

  return JSON.parse(response.body);
}

function normalizeProducts(products) {
  return products
    .map((product) => {
      const idCandidate = product.id ?? product.product_id ?? product.productId;
      const id = Number(idCandidate);
      if (!Number.isFinite(id)) {
        return null;
      }
      const images = [];
      if (Array.isArray(product.images)) {
        for (const item of product.images) {
          if (typeof item === 'string') images.push(item);
          else if (item?.url) images.push(item.url);
        }
      }
      if (product.image) images.push(product.image);
      if (product.thumbnail) images.push(product.thumbnail);
      return {
        id,
        name: product.name || product.title || `${product.brand || ''} ${product.model || product.type || ''}`.trim(),
        type: product.type || null,
        brand: product.brand || null,
        model: product.model || null,
        image: images.find((item) => typeof item === 'string') || null,
        variantsCount: Array.isArray(product.variants) ? product.variants.length : product.variants_count ?? null,
        raw: product,
      };
    })
    .filter(Boolean);
}

async function fetchCatalog() {
  const limit = 100;
  let offset = 0;
  const allProducts = [];

  while (true) {
    console.info(`Solicitando catalogo (offset=${offset})...`);
    const payload = await fetchPage(limit, offset);
    const pageProducts = Array.isArray(payload?.result?.products)
      ? payload.result.products
      : Array.isArray(payload?.result)
        ? payload.result
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    allProducts.push(...pageProducts);

    if (!Array.isArray(payload?.paging)) {
      if (pageProducts.length < limit) {
        break;
      }
      offset += limit;
      continue;
    }

    const total = payload.paging?.total || allProducts.length;
    offset += limit;
    if (offset >= total || pageProducts.length < limit) {
      break;
    }
  }

  const normalized = normalizeProducts(allProducts);
  const output = {
    fetchedAt: new Date().toISOString(),
    source: 'printful',
    products: normalized,
  };

  const outDir = path.resolve(process.cwd(), 'mocks');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'printful-catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.info(`Catalogo guardado en ${outPath} con ${normalized.length} productos.`);
}

fetchCatalog().catch((error) => {
  console.error('Error fatal obteniendo catalogo:', error);
  process.exit(1);
});
