import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer .env.local manualmente
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local')
    const envFile = readFileSync(envPath, 'utf-8')
    const env = {}
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)/)
      if (match) {
        env[match[1].trim()] = match[2].trim()
      }
    })
    return env
  } catch {
    return process.env
  }
}

const env = loadEnv()

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listAllQRs() {
  console.log('🔍 LISTANDO TODOS LOS QRs EN LA BASE DE DATOS...\n')
  
  const { data: qrs, error } = await supabase
    .from('qrs')
    .select('id, code, title, event_id, is_active, scan_count')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  if (!qrs || qrs.length === 0) {
    console.log('❌ No hay QRs en la base de datos')
    return
  }
  
  console.log(`✅ Encontrados ${qrs.length} QR(s):\n`)
  
  qrs.forEach((qr, idx) => {
    console.log(`${idx + 1}. Código: ${qr.code}`)
    console.log(`   ID: ${qr.id}`)
    console.log(`   Título: ${qr.title || '(sin título)'}`)
    console.log(`   Evento: ${qr.event_id || '(sin evento)'}`)
    console.log(`   Activo: ${qr.is_active}`)
    console.log(`   Escaneos: ${qr.scan_count || 0}`)
    console.log('')
  })
  
  // Buscar específicamente el código similar
  console.log('🔎 Buscando códigos similares a "418be880e8a6"...\n')
  
  const similar = qrs.filter(qr => 
    qr.code.toLowerCase().includes('418be880e8a6') ||
    qr.code.toLowerCase().includes('418be880') ||
    qr.code.includes('418')
  )
  
  if (similar.length > 0) {
    console.log(`✅ Encontrados ${similar.length} código(s) similar(es):`)
    similar.forEach(qr => {
      console.log(`   → ${qr.code}`)
    })
  } else {
    console.log('❌ No se encontraron códigos similares')
    console.log('\n💡 El código exacto que buscas puede tener:')
    console.log('   - Mayúsculas/minúsculas diferentes')
    console.log('   - Guiones o prefijos')
    console.log('   - Estar en otra base de datos')
  }
}

listAllQRs()

