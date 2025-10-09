import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const ENV_PATH = '.env.local';
const envText = readFileSync(ENV_PATH, 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const orderId = process.argv[2];
const eventId = process.argv[3];
const userId = process.argv[4];

const run = async () => {
  if (orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, user_id, status, total_amount, event_type, qr_group_id, qr_codes, created_at')
      .eq('id', orderId)
      .maybeSingle();
    console.log('\nOrder:');
    if (error) console.error(error);
    else console.dir(data, { depth: null });
  }
  if (eventId) {
    const { data, error } = await supabase
      .from('events')
      .select('id, owner_id, status, type, order_id, qr_group_id, event_date, expires_at, created_at')
      .eq('id', eventId)
      .maybeSingle();
    console.log('\nEvent:');
    if (error) console.error(error);
    else console.dir(data, { depth: null });
  }
  if (userId) {
    const { data, error } = await supabase
      .from('events')
      .select('id, order_id, status, type, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('\nLatest events for user:');
    if (error) console.error(error);
    else console.dir(data, { depth: null });
  }
  process.exit(0);
};

run();
