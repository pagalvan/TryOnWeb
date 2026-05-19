import { NextResponse } from "next/server"
import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response || NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ message: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    // Validate file type to prevent malicious uploads (XSS/Malware)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Tipo de archivo no permitido" }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp']
    if (!fileExt || !allowedExts.includes(fileExt)) {
      return NextResponse.json({ message: "Extensión de archivo no permitida" }, { status: 400 })
    }

    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    const supabase = getSupabaseAdminClient()
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error("Supabase upload error", uploadError)
      return NextResponse.json({ message: "Error al subir imagen" }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload route error", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
