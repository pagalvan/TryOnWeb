import { z } from "zod"

const phoneRegex = /^[0-9+()\s-]{7,20}$/

export const settingsPayloadSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre es demasiado largo"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Teléfono inválido")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  company: z
    .string()
    .trim()
    .min(2, "El nombre de la empresa es muy corto")
    .max(120, "El nombre de la empresa es demasiado largo")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  notifications: z.object({
    stockAlerts: z.boolean(),
    weeklyReports: z.boolean(),
    newTryons: z.boolean(),
  }),
  appearance: z.object({
    theme: z.enum(["light", "dark", "system"]),
    animations: z.boolean(),
  }),
  lens: z.object({
    apiKey: z
      .string()
      .trim()
      .max(255, "La API key es demasiado larga")
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : null)),
    renderQuality: z.enum(["standard", "high"]),
    advancedFaceTracking: z.boolean(),
  }),
  security: z.object({
    twoFactor: z.boolean(),
  }),
})

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
