import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const tables = [
  { name: 'qr_designs', filter: (query) => query.not('qr_code', 'is', null) },
  { name: 'qrs', filter: (query) => query.not('id', 'is', null) },
  { name: 'orders', filter: (query) => query.not('id', 'is', null) },
  { name: 'order_items', filter: (query) => query.not('id', 'is', null) },
  { name: 'scans', filter: (query) => query.not('id', 'is', null) },
  { name: 'claims', filter: (query) => query.not('id', 'is', null) },
  { name: 'group_members', filter: (query) => query.not('id', 'is', null) },
  { name: 'groups', filter: (query) => query.not('id', 'is', null) },
];

async function wipeTables() {
  const results = [];
  for (const table of tables) {
    try {
      let query = supabase.from(table.name).delete();
      query = table.filter(query);
      const { error } = await query;
      if (error) {
        console.warn(`[tables] ${table.name}:`, error.message);
        results.push({ table: table.name, status: 'error', message: error.message });
      } else {
        results.push({ table: table.name, status: 'ok' });
      }
    } catch (error) {
      console.warn(`[tables] ${table.name}:`, error instanceof Error ? error.message : error);
      results.push({ table: table.name, status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}

async function listAllFiles(prefix = '') {
  const { data, error } = await supabase.storage.from('designs').list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    console.warn('[storage] list error:', error.message);
    return [];
  }

  const files = [];
  for (const entry of data || []) {
    if (entry.name === '.emptyFolderPlaceholder') {
      continue;
    }
    if (entry?.type === 'file') {
      files.push(prefix ? `${prefix}/${entry.name}` : entry.name);
    } else if (entry.name) {
      const folderPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      const nested = await listAllFiles(folderPrefix);
      files.push(...nested);
    }
  }
  return files;
}

async function wipeStorage() {
  try {
    const files = await listAllFiles('');
    if (!files.length) {
      return { removed: 0 };
    }
    const { error } = await supabase.storage.from('designs').remove(files);
    if (error) {
      console.warn('[storage] remove error:', error.message);
      return { removed: 0, error: error.message };
    }
    return { removed: files.length };
  } catch (error) {
    console.warn('[storage] unexpected error:', error instanceof Error ? error.message : error);
    return { removed: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.info('--- Resetting Supabase data ---');
  const tableResults = await wipeTables();
  const storageResult = await wipeStorage();

  console.table(tableResults);
  console.info('[storage] designs bucket removed files:', storageResult.removed);
  if (storageResult.error) {
    console.warn('[storage] error:', storageResult.error);
  }

  console.info('Done.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error while resetting Supabase:', error);
  process.exit(1);
});
