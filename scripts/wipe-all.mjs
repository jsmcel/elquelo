// Wipe ALL app data from the linked Supabase project (remote).
// Uses service role from .env.local. Deletes rows in dependency-safe order
// and clears the 'designs' storage bucket. Does not touch auth.users.

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const out = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=(.*)$/i)
    if (!m) continue
    const [, k, raw] = m
    let v = raw.trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[k] = v
  }
  return out
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const service = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sb = createClient(url, service, { auth: { persistSession: false } })

const tablesInOrder = [
  // Event domain (children first)
  'event_album_media',
  'event_albums',
  'event_pages',
  'event_messages',
  'event_prueba_attempts',
  'event_pruebas',
  'qr_destination_metrics_daily',
  'qr_destinations',
  'event_modules',
  'event_members',
  'event_actions_log',
  // Core commerce + tracking
  'qr_designs',
  'scans',
  'order_items',
  'offer_redemptions',
  'orders',
  'subscriptions',
  'offers',
  // Groups and QRs
  'group_members',
  'qrs',
  'groups',
  'events',
  // App profile extension (keep auth.users intact)
  'users',
]

async function safeDelete(table, idColumn = 'id') {
  try {
    let query = sb.from(table).delete()
    // For rare tables without 'id' column, try a different one
    if (idColumn === 'id') {
      query = query.not('id', 'is', null)
    } else {
      query = query.not(idColumn, 'is', null)
    }
    const { error } = await query
    if (error) throw error
    return { table, status: 'ok' }
  } catch (e) {
    return { table, status: 'error', message: e?.message || String(e) }
  }
}

async function wipeStorage(bucket) {
  try {
    // List recursively (depth=2 quick walk)
    const list = async (prefix = '') => {
      const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 })
      if (error) return []
      const files = []
      for (const entry of data || []) {
        if (entry.type === 'file') files.push(prefix ? `${prefix}/${entry.name}` : entry.name)
        if (entry.type === 'folder') {
          const nested = await list(prefix ? `${prefix}/${entry.name}` : entry.name)
          files.push(...nested)
        }
      }
      return files
    }
    const files = await list('')
    if (!files.length) return { removed: 0 }
    const { error } = await sb.storage.from(bucket).remove(files)
    if (error) return { removed: 0, error: error.message }
    return { removed: files.length }
  } catch (e) {
    return { removed: 0, error: e?.message || String(e) }
  }
}

async function main() {
  console.log('Wiping remote Supabase data...')
  const results = []
  for (const t of tablesInOrder) {
    const r = await safeDelete(t)
    results.push(r)
    console.log(`- ${t}: ${r.status}${r.message ? ' (' + r.message + ')' : ''}`)
  }

  const storage = await wipeStorage('designs')
  console.log(`Storage designs removed: ${storage.removed}${storage.error ? ' error: ' + storage.error : ''}`)

  console.table(results)
}

main().catch((e) => {
  console.error('wipe-all failed:', e)
  process.exit(1)
})

