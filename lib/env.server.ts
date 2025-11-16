const missingVarError = (name: string) =>
  new Error(`Missing required environment variable: ${name}`)

const optionalEnv = (name: string) => process.env[name]

const requiredEnv = (name: string) => {
  const value = optionalEnv(name)
  if (value === undefined || value === "") {
    throw missingVarError(name)
  }
  return value
}

const normalizeUrl = (value: string) => {
  const trimmed = value.replace(/\/$/, "")
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

const resolveSupabaseUrl = () => {
  const url = optionalEnv("NEXT_PUBLIC_SUPABASE_URL") ?? optionalEnv("SUPABASE_URL")
  if (!url) {
    throw missingVarError("NEXT_PUBLIC_SUPABASE_URL")
  }
  const normalized = normalizeUrl(url)

  // Expose the normalized version to the browser bundle as well
  process.env.NEXT_PUBLIC_SUPABASE_URL = normalized
  return normalized
}

const resolveSupabaseAnonKey = () =>
  optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  optionalEnv("SUPABASE_ANON_KEY") ??
  optionalEnv("SUPABASE_SERVICE_ROLE_KEY")

const resolveSiteUrl = () => {
  const siteEnv = optionalEnv("NEXT_PUBLIC_SITE_URL") ?? optionalEnv("FRONTEND_URL")
  if (siteEnv) {
    return normalizeUrl(siteEnv)
  }

  const vercel = optionalEnv("NEXT_PUBLIC_VERCEL_URL") ?? optionalEnv("VERCEL_URL")
  if (vercel) {
    return normalizeUrl(vercel)
  }

  return "http://localhost:3000"
}

export const serverEnv = {
  nodeEnv: optionalEnv("NODE_ENV") ?? "development",
  supabaseUrl: resolveSupabaseUrl(),
  supabaseServiceKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey: resolveSupabaseAnonKey(),
  jwtSecret: requiredEnv("JWT_SECRET"),
  siteUrl: resolveSiteUrl(),
}

export const isProduction = serverEnv.nodeEnv === "production"
