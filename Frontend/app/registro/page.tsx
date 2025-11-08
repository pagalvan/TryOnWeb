"use client"


import React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import Image from "next/image"
function RegistroHeader() {
  return (
  <nav className="bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" prefetch={true}>
            <Image src="/logo.png" alt="TryOnWeb Logo" width={50} height={32} className="object-contain" priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" prefetch={true}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Acceder</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

type RegisterFormValues = {
  nombre: string
  cedula: string
  telefono?: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegistroPage() {
  const { toast } = useToast()

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      nombre: "",
      cedula: "",
      telefono: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Aquí podrías llamar a tu API (p. ej. /api/auth/register) o a Supabase
      // Por ahora simulamos éxito
      await new Promise((r) => setTimeout(r, 600))

      toast({
        title: "Registro completado",
        description: "Cuenta creada correctamente. Puedes iniciar sesión.",
      })

      reset()
    } catch (err: any) {
      toast({
        title: "Error al registrar",
        description: err?.message || "Ocurrió un error al crear la cuenta.",
      })
    }
  }

  const password = watch("password")

  return (
    <div className="min-h-screen bg-background">
      <RegistroHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-12">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-4 text-foreground">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Regístrate para usar el probador virtual y acceder a las funcionalidades del sistema.
          </p>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre y apellidos"
                    {...register("nombre", {
                      required: "El nombre es obligatorio",
                      minLength: { value: 2, message: "Nombre demasiado corto" },
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.nombre?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de cédula"
                    {...register("cedula", {
                      required: "La cédula es obligatoria",
                      pattern: { value: /^\d{6,}$/, message: "Cédula inválida" },
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.cedula?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="3001234567"
                    {...register("telefono", {
                      pattern: { value: /^\d{7,15}$/, message: "Teléfono inválido" },
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.telefono?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    placeholder="correo@ejemplo.com"
                    {...register("email", {
                      required: "El correo es obligatorio",
                      pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Correo inválido" },
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.email?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    {...register("password", {
                      required: "La contraseña es obligatoria",
                      minLength: { value: 6, message: "La contraseña debe tener al menos 6 caracteres" },
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.password?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Repite la contraseña"
                    {...register("confirmPassword", {
                      required: "Confirma la contraseña",
                      validate: (val) => val === password || "Las contraseñas no coinciden",
                    })}
                  />
                </FormControl>
                <FormMessage>{errors.confirmPassword?.message}</FormMessage>
              </FormItem>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Button type="submit" size="lg" className="rounded-full" disabled={isSubmitting}>
                  Crear cuenta
                </Button>

                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  )
}
