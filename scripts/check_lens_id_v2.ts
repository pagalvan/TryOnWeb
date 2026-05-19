
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLensMetadata() {
  const targetId = '94fe28e0-0663-4d10-9409-ebbe5025b572'
  console.log(`Checking metadata for lens asset: ${targetId}`)

  const { data, error } = await supabase
    .from('lens_assets')
    .select('*')
    .eq('id', targetId)
    .single()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Lens Asset Metadata:', JSON.stringify(data.metadata, null, 2))
  }
}

checkLensMetadata()
