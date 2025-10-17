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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixQRDestination() {
  const QR_CODE = '418be880e8a6'
  
  console.log('🔧 ARREGLANDO DESTINO DEL QR:', QR_CODE, '\n')
  
  // 1. Buscar el QR
  const { data: qr } = await supabase
    .from('qrs')
    .select('id, code')
    .eq('code', QR_CODE)
    .single()
  
  if (!qr) {
    console.log('❌ QR no encontrado')
    return
  }
  
  console.log('✅ QR encontrado:', qr.id, '\n')
  
  // 2. Buscar TODOS los destinos de este QR
  const { data: destinations } = await supabase
    .from('qr_destinations')
    .select('*')
    .eq('qr_id', qr.id)
    .order('created_at', { ascending: false })
  
  if (!destinations || destinations.length === 0) {
    console.log('❌ No hay destinos para este QR')
    return
  }
  
  console.log(`📊 Destinos encontrados: ${destinations.length}\n`)
  
  destinations.forEach((dest, idx) => {
    console.log(`${idx + 1}. ${dest.label}`)
    console.log(`   Target: ${dest.target_url}`)
    console.log(`   Type: ${dest.type}`)
    console.log(`   Active: ${dest.is_active}`)
    console.log(`   ID: ${dest.id}`)
    console.log('')
  })
  
  // 3. Buscar el destino de Marca.com
  const marcaDestination = destinations.find(d => 
    d.target_url?.includes('marca.com') ||
    d.label?.toLowerCase().includes('marca')
  )
  
  if (!marcaDestination) {
    console.log('❌ No se encontró el destino de Marca.com')
    console.log('💡 Puedes crear uno desde el dashboard')
    return
  }
  
  console.log('🎯 Destino de Marca encontrado:', marcaDestination.id)
  console.log(`   URL: ${marcaDestination.target_url}`)
  console.log(`   Actualmente activo: ${marcaDestination.is_active}\n`)
  
  // 4. Desactivar TODOS los destinos excepto el de Marca
  console.log('🔄 Desactivando otros destinos...')
  
  for (const dest of destinations) {
    if (dest.id !== marcaDestination.id && dest.is_active) {
      await supabase
        .from('qr_destinations')
        .update({ is_active: false })
        .eq('id', dest.id)
      console.log(`   ✓ Desactivado: ${dest.label}`)
    }
  }
  
  // 5. Activar el destino de Marca
  console.log('🔄 Activando destino de Marca...')
  await supabase
    .from('qr_destinations')
    .update({ is_active: true })
    .eq('id', marcaDestination.id)
  
  // 6. Actualizar el QR para que apunte a este destino
  console.log('🔄 Actualizando QR...')
  await supabase
    .from('qrs')
    .update({ active_destination_id: marcaDestination.id })
    .eq('id', qr.id)
  
  console.log('\n✅ ¡LISTO! Ahora el QR redirige a Marca.com')
  console.log(`\n🧪 Prueba accediendo a: http://localhost:3000/qr/${QR_CODE}`)
}

fixQRDestination()
















