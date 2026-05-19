import {
  Shirt,
  ShoppingBag,
  Gem,
  Watch,
  Palette,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react"

export type IconOption = {
  value: string
  label: string
  icon: LucideIcon
}

export const CATEGORY_ICON_OPTIONS: IconOption[] = [
  { value: "Shirt", label: "Prendas", icon: Shirt },
  { value: "ShoppingBag", label: "Accesorios", icon: ShoppingBag },
  { value: "Gem", label: "Joyas", icon: Gem },
  { value: "Watch", label: "Relojes", icon: Watch },
  { value: "Palette", label: "Arte y diseño", icon: Palette },
  { value: "Sparkles", label: "Destacados", icon: Sparkles },
  { value: "Tag", label: "Ofertas", icon: Tag },
]

export type IconValue = (typeof CATEGORY_ICON_OPTIONS)[number]["value"]

export const CATEGORY_ICON_MAP: Record<IconValue, LucideIcon> = CATEGORY_ICON_OPTIONS.reduce(
  (acc, option) => {
    return { ...acc, [option.value]: option.icon }
  },
  {} as Record<IconValue, LucideIcon>
)

export type CategoryFormState = {
  id: string | null
  nombre: string
  descripcion: string
  estado: "activa" | "inactiva"
  icon: IconValue | ""
}

export const STATUS_OPTIONS = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
]

export const getInitialCategoryForm = (): CategoryFormState => ({
  id: null,
  nombre: "",
  descripcion: "",
  estado: "activa",
  icon: "",
})
