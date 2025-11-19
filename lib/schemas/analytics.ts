import { z } from "zod"

export const productEventSchema = z.object({
  productId: z.string({ required_error: "Producto requerido" }).uuid("Producto inválido"),
  eventType: z.enum(["view", "tryon", "favorite", "share"], {
    required_error: "Tipo de evento requerido",
    invalid_type_error: "Tipo de evento inválido",
  }),
  metadata: z.record(z.unknown()).optional(),
})
