import { z } from "zod"

const baseCategorySchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120, "Nombre demasiado largo"),
  descripcion: z
    .string()
    .trim()
    .max(500, "Descripción demasiado larga")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
  estado: z.enum(["activa", "inactiva"]).optional(),
  icon: z
    .string()
    .trim()
    .max(120, "Icono demasiado largo")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value)),
})

export const categoryCreateSchema = baseCategorySchema.extend({
  estado: baseCategorySchema.shape.estado.default("activa"),
})

export const categoryUpdateSchema = baseCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "No se enviaron cambios",
  }
)

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
