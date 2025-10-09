import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const env = {}
    for (const line of content.split('
')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...valueParts] = trimmed.split('=')
      if (!key || valueParts.length === 0) continue
      env[key] = valueParts.join('=')
    }
    return env
  } catch (error) {
    console.error('No pude leer .env.local:', error.message)
    return {}
  }
}

const env = loadEnvFile()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteAll(table, column = 'id') {
  console.log(`
🗑️  Eliminando ${table}...`)
  const { data, error } = await supabase
    .from(table)
    .delete()
    .not(column, 'is', null)
    .select(column, { count: 'exact' })

  if (error) {
    console.error(`❌ Error eliminando ${table}:`, error)
  } else {
    console.log(`✅ ${data?.length ?? 0} filas eliminadas de ${table}`)
  }
}

async function resetBuckets() {
  console.log('
🗑️  Limpiando buckets de storage...')
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('❌ Error listando buckets:', error)
    return
  }

  for (const bucket of buckets) {
    const { data: files, error: listError } = await supabase.storage
      .from(bucket.name)
      .list('', { limit: 1000 })
    if (listError) {
      console.error(`❌ Error listando archivos en ${bucket.name}:`, listError)
      continue
    }
    if (!files || files.length === 0) {
      console.log(`✅ ${bucket.name} ya estaba vacío`)
      continue
    }
    const paths = files.map((file) => file.name)
    const { error: removeError } = await supabase.storage.from(bucket.name).remove(paths)
    if (removeError) {
      console.error(`❌ Error limpiando ${bucket.name}:`, removeError)
    } else {
      console.log(`✅ Eliminados ${paths.length} archivos de ${bucket.name}`)
    }
  }
}

async function main() {
  const tables = [
    ['qr_destinations'],
    ['event_pruebas'],
    ['event_modules'],
    ['event_members'],
    ['event_actions_log'],
    ['events'],
    ['qr_designs', 'qr_code'],
    ['qrs'],
    ['group_members'],
    ['groups'],
    ['orders'],
    ['album_media'],
  ]

  for (const [table, column] of tables) {
    await deleteAll(table, column ?? 'id')
  }

  await resetBuckets()

  console.log('
✅ Base de datos limpia. Listo para empezar desde cero.')
}

main().catch((error) => {
  console.error('❌ Error general:', error)
  process.exit(1)
})
