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

async function finalCleanup() {
  try {
    console.log('🧹 LIMPIEZA FINAL ESPECÍFICA...\n')
    
    // 1. Limpiar QRs usando una consulta diferente
    console.log('🗑️  Limpiando QRs restantes...')
    const { data: qrs, error: getQRError } = await supabase
      .from('qrs')
      .select('id')
    
    if (getQRError) {
      console.error('❌ Error obteniendo QRs:', getQRError)
    } else if (qrs && qrs.length > 0) {
      for (const qr of qrs) {
        const { error: deleteError } = await supabase
          .from('qrs')
          .delete()
          .eq('id', qr.id)
        
        if (deleteError) {
          console.error(`❌ Error eliminando QR ${qr.id}:`, deleteError)
        }
      }
      console.log(`✅ ${qrs.length} QRs eliminados`)
    } else {
      console.log('✅ No hay QRs para eliminar')
    }
    
    // 2. Limpiar grupos
    console.log('🗑️  Limpiando grupos restantes...')
    const { data: groups, error: getGroupsError } = await supabase
      .from('groups')
      .select('id')
    
    if (getGroupsError) {
      console.error('❌ Error obteniendo grupos:', getGroupsError)
    } else if (groups && groups.length > 0) {
      for (const group of groups) {
        const { error: deleteError } = await supabase
          .from('groups')
          .delete()
          .eq('id', group.id)
        
        if (deleteError) {
          console.error(`❌ Error eliminando grupo ${group.id}:`, deleteError)
        }
      }
      console.log(`✅ ${groups.length} grupos eliminados`)
    } else {
      console.log('✅ No hay grupos para eliminar')
    }
    
    // 3. Limpiar miembros de grupos
    console.log('🗑️  Limpiando miembros restantes...')
    const { data: members, error: getMembersError } = await supabase
      .from('group_members')
      .select('id')
    
    if (getMembersError) {
      console.error('❌ Error obteniendo miembros:', getMembersError)
    } else if (members && members.length > 0) {
      for (const member of members) {
        const { error: deleteError } = await supabase
          .from('group_members')
          .delete()
          .eq('id', member.id)
        
        if (deleteError) {
          console.error(`❌ Error eliminando miembro ${member.id}:`, deleteError)
        }
      }
      console.log(`✅ ${members.length} miembros eliminados`)
    } else {
      console.log('✅ No hay miembros para eliminar')
    }
    
    // 4. Verificar limpieza final
    console.log('\n🔍 Verificación final...')
    
    const tablesToCheck = [
      { name: 'qr_designs', table: 'qr_designs' },
      { name: 'QRs', table: 'qrs' },
      { name: 'grupos', table: 'groups' },
      { name: 'miembros', table: 'group_members' },
      { name: 'órdenes', table: 'orders' }
    ]
    
    let allClean = true
    
    for (const { name, table } of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact' })
        if (error) {
          console.log(`❌ Error verificando ${name}: ${error.message}`)
          allClean = false
        } else {
          const count = data?.length || 0
          console.log(`📊 ${name}: ${count} registros`)
          if (count > 0) allClean = false
        }
      } catch (err) {
        console.log(`❌ Error verificando ${name}: ${err.message}`)
        allClean = false
      }
    }
    
    console.log('\n🎉 LIMPIEZA FINAL COMPLETADA')
    if (allClean) {
      console.log('✅ TODA LA BASE DE DATOS ESTÁ COMPLETAMENTE LIMPIA')
      console.log('🚀 LISTA PARA EMPEZAR DESDE CERO')
    } else {
      console.log('⚠️  Algunas tablas aún tienen datos')
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza final:', error)
  }
}

finalCleanup()
