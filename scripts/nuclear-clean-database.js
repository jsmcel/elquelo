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
    console.log('☢️  LIMPIEZA NUCLEAR DE TODA LA BASE DE DATOS...\n')
    
    // 1. Eliminar TODOS los diseños
    console.log('🗑️  Eliminando TODOS los diseños...')
    const { error: deleteDesignsError } = await supabase
      .from('qr_designs')
      .delete()
      .neq('qr_code', '')
    
    if (deleteDesignsError) {
      console.error('❌ Error eliminando diseños:', deleteDesignsError)
    } else {
      console.log('✅ Todos los diseños eliminados')
    }
    
    // 2. Eliminar TODOS los QRs
    console.log('🗑️  Eliminando TODOS los QRs...')
    const { error: deleteQRError } = await supabase
      .from('qrs')
      .delete()
      .not('id', 'is', null)
    
    if (deleteQRError) {
      console.error('❌ Error eliminando QRs:', deleteQRError)
    } else {
      console.log('✅ Todos los QRs eliminados')
    }
    
    // 3. Eliminar TODOS los grupos
    console.log('🗑️  Eliminando TODOS los grupos...')
    const { error: deleteGroupsError } = await supabase
      .from('groups')
      .delete()
      .not('id', 'is', null)
    
    if (deleteGroupsError) {
      console.error('❌ Error eliminando grupos:', deleteGroupsError)
    } else {
      console.log('✅ Todos los grupos eliminados')
    }
    
    // 4. Eliminar TODOS los miembros de grupos
    console.log('🗑️  Eliminando TODOS los miembros de grupos...')
    const { error: deleteMembersError } = await supabase
      .from('group_members')
      .delete()
      .not('id', 'is', null)
    
    if (deleteMembersError) {
      console.error('❌ Error eliminando miembros:', deleteMembersError)
    } else {
      console.log('✅ Todos los miembros eliminados')
    }
    
    // 5. Eliminar TODAS las órdenes
    console.log('🗑️  Eliminando TODAS las órdenes...')
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .not('id', 'is', null)
    
    if (deleteOrdersError) {
      console.error('❌ Error eliminando órdenes:', deleteOrdersError)
    } else {
      console.log('✅ Todas las órdenes eliminadas')
    }
    
    // 6. Eliminar TODOS los NFTs (si la tabla existe)
    console.log('🗑️  Eliminando TODOS los NFTs...')
    try {
      const { error: deleteNFTsError } = await supabase
        .from('nfts')
        .delete()
        .not('id', 'is', null)
      
      if (deleteNFTsError) {
        console.log('ℹ️  Tabla NFTs no existe o ya está vacía')
      } else {
        console.log('✅ Todos los NFTs eliminados')
      }
    } catch (error) {
      console.log('ℹ️  Tabla NFTs no existe')
    }
    
    // 7. Limpiar TODOS los buckets de storage
    console.log('🗑️  Limpiando TODOS los buckets de storage...')
    
    // Listar todos los buckets
    const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets()
    
    if (listBucketsError) {
      console.error('❌ Error listando buckets:', listBucketsError)
    } else {
      for (const bucket of buckets) {
        console.log(`   🗑️  Limpiando bucket: ${bucket.name}`)
        
        // Listar todos los archivos en el bucket
        const { data: files, error: listFilesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 })
        
        if (listFilesError) {
          console.error(`   ❌ Error listando archivos en ${bucket.name}:`, listFilesError)
          continue
        }
        
        if (files.length > 0) {
          // Eliminar todos los archivos
          const filePaths = files.map(file => file.name)
          const { error: deleteFilesError } = await supabase.storage
            .from(bucket.name)
            .remove(filePaths)
          
          if (deleteFilesError) {
            console.error(`   ❌ Error eliminando archivos de ${bucket.name}:`, deleteFilesError)
          } else {
            console.log(`   ✅ ${files.length} archivos eliminados de ${bucket.name}`)
          }
        } else {
          console.log(`   ✅ ${bucket.name} ya estaba vacío`)
        }
      }
    }
    
    // 8. Verificar limpieza completa
    console.log('\n🔍 Verificando limpieza nuclear...')
    
    const tablesToCheck = [
      { name: 'qr_designs', table: 'qr_designs' },
      { name: 'QRs', table: 'qrs' },
      { name: 'grupos', table: 'groups' },
      { name: 'miembros', table: 'group_members' },
      { name: 'órdenes', table: 'orders' },
      { name: 'NFTs', table: 'nfts', optional: true }
    ]
    
    for (const { name, table, optional } of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact' })
        if (error) {
          if (optional) {
            console.log(`ℹ️  ${name}: tabla no existe`)
          } else {
            console.log(`❌ Error verificando ${name}: ${error.message}`)
          }
        } else {
          console.log(`📊 ${name} restantes: ${data?.length || 0}`)
        }
      } catch (err) {
        if (optional) {
          console.log(`ℹ️  ${name}: tabla no existe`)
        } else {
          console.log(`❌ Error verificando ${name}: ${err.message}`)
        }
      }
    }
    
    console.log('\n☢️  LIMPIEZA NUCLEAR COMPLETADA')
    console.log('💥 TODA LA BASE DE DATOS HA SIDO LIMPIADA')
    console.log('🔥 TODOS LOS ARCHIVOS HAN SIDO ELIMINADOS')
    console.log('🚀 LA APLICACIÓN ESTÁ LISTA PARA EMPEZAR DESDE CERO')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza nuclear:', error)
  }
}

// Confirmación antes de ejecutar
console.log('⚠️  ADVERTENCIA: ESTO ELIMINARÁ TODOS LOS DATOS')
console.log('⚠️  NO SE PUEDE DESHACER')
console.log('⚠️  ¿Estás seguro? (Ctrl+C para cancelar)')
console.log('⚠️  Ejecutando en 5 segundos...\n')

setTimeout(() => {
  nuclearCleanDatabase()
}, 5000)

