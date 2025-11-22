export type SettingsNotifications = {
  stockAlerts: boolean
  weeklyReports: boolean
  newTryons: boolean
}

export type SettingsAppearance = {
  darkMode: boolean
  animations: boolean
}

export type SettingsLensPreferences = {
  apiKey: string | null
  renderQuality: "standard" | "high"
  advancedFaceTracking: boolean
}

export type SettingsSecurity = {
  twoFactor: boolean
}

export type SettingsPreferences = {
  notifications: SettingsNotifications
  appearance: SettingsAppearance
  lens: SettingsLensPreferences
  security: SettingsSecurity
}

export type SettingsProfile = {
  id: string
  email: string
  displayName: string | null
  phone: string | null
  company: string | null
  role: "cliente" | "admin"
  updatedAt: string | null
}

export type SettingsMetrics = {
  totalProducts: number
  totalCategories: number
  totalInventoryUnits: number
  lowStockLocations: number
  tryOnSessions: number
  lastInventoryReport: string | null
}

export type SettingsResponseData = {
  profile: SettingsProfile
  preferences: SettingsPreferences
  metrics: SettingsMetrics
}

export type SettingsUpdatePayload = {
  displayName: string
  phone: string | null
  company: string | null
  notifications: SettingsNotifications
  appearance: SettingsAppearance
  lens: SettingsLensPreferences
  security: SettingsSecurity
}
