const trimTrailingSlash = (value?: string | null) => value?.replace(/\/$/, "")

const CLIENT_BASE_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL ?? "") ?? ""

const inferServerBaseUrl = () => {
  const explicit = trimTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL)
  if (explicit) return explicit

  const site = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL)
  if (site) return site

  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const normalizedVercel = trimTrailingSlash(vercel)
  if (normalizedVercel) return normalizedVercel

  return "http://localhost:3000"
}

const SERVER_BASE_URL = inferServerBaseUrl()

type RequestOptions = RequestInit & { skipAuth?: boolean }

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }
  return null
}

const resolveUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (typeof window === "undefined") {
    return `${SERVER_BASE_URL}${normalizedPath}`
  }

  return CLIENT_BASE_URL ? `${CLIENT_BASE_URL}${normalizedPath}` : normalizedPath
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    let headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }

    if (typeof window === "undefined" && !options.skipAuth) {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      const cookieHeader = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ")
      if (cookieHeader) {
        headers = {
          ...headers,
          cookie: cookieHeader,
        }
      }
    }

    const response = await fetch(resolveUrl(path), {
      ...options,
      credentials: options.credentials ?? (options.skipAuth ? "same-origin" : "include"),
      headers,
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      const message = typeof data?.message === "string" ? data.message : "Error en la solicitud"
      throw new Error(message)
    }

    return data as T
  } catch (error) {
    if (error instanceof Error && error.message === "Failed to fetch") {
      throw new Error("No se pudo conectar con el servidor")
    }

    throw error instanceof Error ? error : new Error("Error imprevisto al llamar a la API")
  }
}
