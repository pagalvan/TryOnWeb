import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const registerSchema = loginSchema.extend({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  telefono: z
    .string()
    .regex(/^\+?[0-9]{7,15}$/u, "Teléfono inválido")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Correo inválido"),
})

export const resetPasswordSchema = z.object({
  accessToken: z.string().min(10, "Token inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})
