const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno desde .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Error reading .env.local:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function nuclearCleanDatabase() {
  try {
    console.log('â˜¢ï¸  LIMPIEZA NUCLEAR DE TODA LA BASE DE DATOS...\n')
    
    // 1. Eliminar TODOS los diseÃ±os
    console.log('ðŸ—‘ï¸  Eliminando TODOS los diseÃ±os...')
    const { error: deleteDesignsError } = await supabase
      .from('qr_designs')
      .delete()
      .not('qr_code', 'is', null)
    
    if (deleteDesignsError) {
      console.error('âŒ Error eliminando diseÃ±os:', deleteDesignsError)
    } else {
      console.log('âœ… Todos los diseÃ±os eliminados')
    }
    
    // 2. Eliminar TODOS los QRs
    console.log('ðŸ—‘ï¸  Eliminando TODOS los QRs...')
    const { error: deleteQRError } = await supabase
      .from('qrs')
      .delete()
      .not('id', 'is', null)
    
    if (deleteQRError) {
      console.error('âŒ Error eliminando QRs:', deleteQRError)
    } else {
      console.log('âœ… Todos los QRs eliminados')
    }
    
    // 3. Eliminar TODOS los grupos
    console.log('ðŸ—‘ï¸  Eliminando TODOS los grupos...')
    const { error: deleteGroupsError } = await supabase
      .from('groups')
      .delete()
      .not('id', 'is', null)
    
    if (deleteGroupsError) {
      console.error('âŒ Error eliminando grupos:', deleteGroupsError)
    } else {
      console.log('âœ… Todos los grupos eliminados')
    }
    
    // 4. Eliminar TODOS los miembros de grupos
    console.log('ðŸ—‘ï¸  Eliminando TODOS los miembros de grupos...')
    const { error: deleteMembersError } = await supabase
      .from('group_members')
      .delete()
      .not('id', 'is', null)
    
    if (deleteMembersError) {
      console.error('âŒ Error eliminando miembros:', deleteMembersError)
    } else {
      console.log('âœ… Todos los miembros eliminados')
    }
    
    // 5. Eliminar TODAS las Ã³rdenes
    console.log('ðŸ—‘ï¸  Eliminando TODAS las Ã³rdenes...')
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .not('id', 'is', null)
    
    if (deleteOrdersError) {
      console.error('âŒ Error eliminando Ã³rdenes:', deleteOrdersError)
    } else {
      console.log('âœ… Todas las Ã³rdenes eliminadas')
    }
    
    // 6. Eliminar TODOS los NFTs
    console.log('ðŸ—‘ï¸  Eliminando TODOS los NFTs...')
    const { error: deleteNFTsError } = await supabase
      .from('nfts')
      .delete()
      .not('id', 'is', null)
    
    if (deleteNFTsError) {
      console.error('âŒ Error eliminando NFTs:', deleteNFTsError)
    } else {
      console.log('âœ… Todos los NFTs eliminados')
    }
    
    // 7. Limpiar TODOS los buckets de storage
    console.log('ðŸ—‘ï¸  Limpiando TODOS los buckets de storage...')
    
    // Listar todos los buckets
    const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets()
    
    if (listBucketsError) {
      console.error('âŒ Error listando buckets:', listBucketsError)
    } else {
      for (const bucket of buckets) {
        console.log(`   ðŸ—‘ï¸  Limpiando bucket: ${bucket.name}`)
        
        // Listar todos los archivos en el bucket
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 })
        
        if (listFilesError) {
          console.error(`   âŒ Error listando archivos en ${bucket.name}:`, listFilesError)
          continue
        }
        
        if (files.length > 0) {
          // Eliminar todos los archivos
          const filePaths = files.map(file => file.name)
          const { error: deleteFilesError } = await supabase.storage
            .from(bucket.name)
            .remove(filePaths)
          
          if (deleteFilesError) {
            console.error(`   âŒ Error eliminando archivos de ${bucket.name}:`, deleteFilesError)
          } else {
            console.log(`   âœ… ${files.length} archivos eliminados de ${bucket.name}`)
          }
        } else {
          console.log(`   âœ… ${bucket.name} ya estaba vacÃ­o`)
        }
      }
    }
    
    // 8. Verificar limpieza completa
    console.log('\nðŸ” Verificando limpieza nuclear...')
    
    const tablesToCheck = [
      { name: 'qr_designs', table: 'qr_designs' },
      { name: 'QRs', table: 'qrs' },
      { name: 'grupos', table: 'groups' },
      { name: 'miembros', table: 'group_members' },
      { name: 'Ã³rdenes', table: 'orders' },
      { name: 'NFTs', table: 'nfts' }
    ]
    
    for (const { name, table } of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact' })
        if (error) {
          console.log(`âŒ Error verificando ${name}: ${error.message}`)
        } else {
          console.log(`ðŸ“Š ${name} restantes: ${data?.length || 0}`)
        }
      } catch (err) {
        console.log(`âŒ Error verificando ${name}: ${err.message}`)
      }
    }
    
    console.log('\nâ˜¢ï¸  LIMPIEZA NUCLEAR COMPLETADA')
    console.log('ðŸ’¥ TODA LA BASE DE DATOS HA SIDO LIMPIADA')
    console.log('ðŸ”¥ TODOS LOS ARCHIVOS HAN SIDO ELIMINADOS')
    console.log('ðŸš€ LA APLICACIÃ“N ESTÃ LISTA PARA EMPEZAR DESDE CERO')
    
  } catch (error) {
    console.error('âŒ Error durante la limpieza nuclear:', error)
  }
}

// ConfirmaciÃ³n antes de ejecutar
console.log('âš ï¸  ADVERTENCIA: ESTO ELIMINARÃ TODOS LOS DATOS')
console.log('âš ï¸  NO SE PUEDE DESHACER')
console.log('âš ï¸  Â¿EstÃ¡s seguro? (Ctrl+C para cancelar)')
console.log('âš ï¸  Ejecutando en 5 segundos...\n')

setTimeout(() => {
  nuclearCleanDatabase()
}, 5000)

