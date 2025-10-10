import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createParticipantsTable() {
  try {
    console.log('🔄 Creating participants table...')
    
    // Create participants table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.participants (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          size TEXT DEFAULT 'M',
          is_novio_novia BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (createError) {
      console.error('Error creating table:', createError)
    } else {
      console.log('✅ Participants table created')
    }
    
    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_participants_group_id ON public.participants(group_id);'
    })
    
    if (indexError) {
      console.error('Error creating index:', indexError)
    } else {
      console.log('✅ Index created')
    }
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError)
    } else {
      console.log('✅ RLS enabled')
    }
    
    console.log('🎉 Participants table setup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createParticipantsTable()



