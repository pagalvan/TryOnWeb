import { z } from "zod"

const lensAssetPayloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    lensId: z.string().max(128).optional(),
    provider: z.string().max(64).optional(),
    tipo: z.enum(["glb", "lens", "image", "video", "anchor"]).optional(),
    url: z.string().max(512).optional(),
    version: z.string().max(128).optional().nullable(),
    metadata: z.record(z.any()).optional().nullable(),
    activo: z.boolean().optional(),
  })
  .partial()

export const productPayloadSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  sku: z.string().max(64).optional().or(z.literal("")),
  categoria_id: z.string().uuid().optional().or(z.literal("")),
  valor_unitario: z
    .number({ invalid_type_error: "El precio debe ser numérico" })
    .min(0, "El precio debe ser positivo")
    .nullable()
    .optional(),
  descripcion: z.string().optional().or(z.literal("")),
  estado: z.enum(["disponible", "reservada", "inactiva"]),
  destacado: z.boolean().default(false),
  tallas: z.array(z.string()).optional().nullable(),
  colores: z.array(z.string()).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  stockInicial: z.number().int().min(0).default(0),
  stockLocationId: z.string().uuid().optional().or(z.literal("")).nullable(),
  ubicacion: z.string().min(2).optional().or(z.literal("")).nullable(),
  lensAsset: lensAssetPayloadSchema.optional().nullable(),
})

export const productUpdateSchema = productPayloadSchema.partial().extend({
  nombre: z.string().min(2).optional(),
})

export const stockSchema = z.object({
  itemId: z.string().uuid().optional().or(z.literal("")),
  bodegaId: z.string().uuid().optional().or(z.literal("")).nullable(),
  ubicacion: z.string().min(2, "La ubicación es obligatoria").optional().or(z.literal("")).nullable(),
  cantidad: z.number().int().min(0, "La cantidad debe ser positiva"),
  cantidad_minima: z.number().int().min(0).default(0),
  estado: z.enum(["ok", "bajo", "sin_stock", "bloqueado"]),
})
