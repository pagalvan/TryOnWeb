export const CAMERA_KIT_DEFAULT_LENS_GROUP_ID =
  process.env.NEXT_PUBLIC_CAMERA_KIT_LENS_GROUP_ID ?? "9cb32233-4f96-4a34-bdb8-b405ffdc21a3"

const CAMERA_KIT_STAGING_TOKEN =
  process.env.NEXT_PUBLIC_CAMERA_KIT_STAGING_TOKEN ?? ""

const CAMERA_KIT_PRODUCTION_TOKEN =
  process.env.NEXT_PUBLIC_CAMERA_KIT_PRODUCTION_TOKEN ?? ""

const CAMERA_KIT_ENV = (process.env.NEXT_PUBLIC_CAMERA_KIT_ENV ?? "staging").toLowerCase()

export const CAMERA_KIT_TOKENS = {
  staging: CAMERA_KIT_STAGING_TOKEN,
  production: CAMERA_KIT_PRODUCTION_TOKEN,
} as const

export function getCameraKitToken() {
  if (CAMERA_KIT_ENV === "production") {
    return CAMERA_KIT_TOKENS.production
  }

  return CAMERA_KIT_TOKENS.staging
}

