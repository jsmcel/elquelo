import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMarcaDestination() {
  const QR_CODE = '418be880e8a6'
  
  const { data: qr } = await supabase
    .from('qrs')
    .select('id, active_destination_id')
    .eq('code', QR_CODE)
    .single()
  
  console.log('📊 QR:', qr.id)
  console.log('📍 active_destination_id:', qr.active_destination_id, '\n')
  
  const { data: destinations } = await supabase
    .from('qr_destinations')
    .select('*')
    .eq('qr_id', qr.id)
    .order('created_at', { ascending: false })
  
  const now = new Date()
  console.log('⏰ Fecha actual:', now.toISOString(), '\n')
  
  console.log('📋 TODOS LOS DESTINOS:\n')
  
  destinations.forEach((dest, idx) => {
    console.log(`${idx + 1}. ${dest.label} (${dest.id})`)
    console.log(`   Target: ${dest.target_url}`)
    console.log(`   is_active: ${dest.is_active}`)
    console.log(`   start_at: ${dest.start_at}`)
    console.log(`   end_at: ${dest.end_at}`)
    console.log(`   priority: ${dest.priority}`)
    
    // Verificar si es válido
    if (dest.is_active) {
      const startAt = dest.start_at ? new Date(dest.start_at) : null
      const endAt = dest.end_at ? new Date(dest.end_at) : null
      
      let valid = true
      let reason = ''
      
      if (startAt && now < startAt) {
        valid = false
        reason = `Empieza en el futuro (${startAt.toLocaleString('es-ES')})`
      }
      if (endAt && now > endAt) {
        valid = false
        reason = `Ya terminó (${endAt.toLocaleString('es-ES')})`
      }
      
      if (valid) {
        console.log(`   ✅ VÁLIDO AHORA`)
      } else {
        console.log(`   ❌ NO VÁLIDO: ${reason}`)
      }
    } else {
      console.log(`   ⚪ INACTIVO`)
    }
    
    if (dest.id === qr.active_destination_id) {
      console.log(`   ⭐ ESTE ES EL active_destination_id`)
    }
    
    console.log('')
  })
}

checkMarcaDestination()








