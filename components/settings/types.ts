export type SettingsFormState = {
  displayName: string
  phone: string
  company: string
  notifications: {
    stockAlerts: boolean
    weeklyReports: boolean
    newTryons: boolean
  }
  appearance: {
    darkMode: boolean
    animations: boolean
  }
  lens: {
    apiKey: string
    renderQuality: "standard" | "high"
    advancedFaceTracking: boolean
  }
  security: {
    twoFactor: boolean
  }
}

export type PasswordFormState = {
  newPassword: string
  confirmPassword: string
}

export const numberFormatter = new Intl.NumberFormat("es-CO")

export const formatDateTime = (value: string | null) => {
  if (!value) return "Sin registros"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin registros"
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export const formatInventoryUnits = (units: number) => {
  if (!Number.isFinite(units)) return "0"
  return numberFormatter.format(Math.max(0, Math.round(units)))
}
