import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://elquelo.eu'

async function fixBienvenidaDestinations() {
  console.log('🔍 Buscando destinos que apuntan a /bienvenida...')

  // Buscar todos los destinos que apuntan a /bienvenida
  const { data: destinations, error } = await supabase
    .from('qr_destinations')
    .select('id, event_id, qr_id, target_url')
    .like('target_url', '%/bienvenida%')

  if (error) {
    console.error('❌ Error buscando destinos:', error)
    return
  }

  if (!destinations || destinations.length === 0) {
    console.log('✅ No hay destinos que actualizar')
    return
  }

  console.log(`📋 Encontrados ${destinations.length} destinos que apuntan a /bienvenida`)

  let updated = 0
  let failed = 0

  for (const dest of destinations) {
    const newTargetUrl = `${APP_URL}/e/${dest.event_id}/microsite`
    
    console.log(`  Actualizando destino ${dest.id}:`)
    console.log(`    Antes: ${dest.target_url}`)
    console.log(`    Después: ${newTargetUrl}`)

    const { error: updateError } = await supabase
      .from('qr_destinations')
      .update({
        target_url: newTargetUrl,
        type: 'microsite',
        label: 'Microsite del evento',
        updated_at: new Date().toISOString()
      })
      .eq('id', dest.id)

    if (updateError) {
      console.error(`    ❌ Error:`, updateError.message)
      failed++
    } else {
      console.log(`    ✅ Actualizado`)
      updated++
    }
  }

  console.log('\n📊 Resumen:')
  console.log(`  ✅ Actualizados: ${updated}`)
  console.log(`  ❌ Fallidos: ${failed}`)
  console.log(`  📝 Total: ${destinations.length}`)
}

fixBienvenidaDestinations()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando script:', error)
    process.exit(1)
  })

