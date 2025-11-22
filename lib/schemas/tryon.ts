import { z } from "zod"

export const tryOnItemStatusSchema = z.enum(["exito", "parcial", "descartado", "pendiente"])

export const startTryOnSessionSchema = z.object({
  productId: z.string({ required_error: "Producto requerido" }).uuid("Producto inválido"),
  lensAssetId: z.string().uuid("Lens inválido").optional().nullable(),
  device: z.string().max(160).optional(),
  platform: z.string().max(80).optional(),
  origin: z.string().max(80).optional(),
})

export const appendTryOnItemSchema = z.object({
  productId: z.string({ required_error: "Producto requerido" }).uuid("Producto inválido"),
  lensAssetId: z.string().uuid("Lens inválido").optional().nullable(),
})

export const updateTryOnItemSchema = z
  .object({
    status: tryOnItemStatusSchema.optional(),
    durationSeconds: z.number().min(0).max(3600).optional(),
  })
  .refine((value) => value.status !== undefined || value.durationSeconds !== undefined, {
    message: "Se requiere al menos un campo para actualizar",
    path: ["status"],
  })

export const closeTryOnSessionSchema = z.object({
  endedAt: z.string().datetime().optional(),
  lastItem: z
    .object({
      itemId: z.string().uuid("Item inválido"),
      status: tryOnItemStatusSchema.optional(),
      durationSeconds: z.number().min(0).max(3600).optional(),
    })
    .optional(),
})
