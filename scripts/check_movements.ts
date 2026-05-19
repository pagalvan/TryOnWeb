
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import * as path from "path"

config({ path: path.resolve(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMovements() {
  const { count, error } = await supabase
    .from("inventario_movimientos")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error fetching movements count:", error)
    return
  }

  console.log(`Total movements in DB: ${count}`)

  const { data, error: dataError } = await supabase
    .from("inventario_movimientos")
    .select("created_at, tipo, cantidad")
    .order("created_at", { ascending: false })
    .limit(5)

  if (dataError) {
    console.error("Error fetching recent movements:", dataError)
    return
  }

  console.log("Recent movements:", data)
}

checkMovements()
