import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("saved_tryons")
    .select("*, prendas(nombre, sku, valor_unitario)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { prenda_id, image_url, tryon_type, metadata } = body

    if (!image_url || !tryon_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    let finalImageUrl = image_url

    // Handle base64 image upload
    if (image_url.startsWith('data:image')) {
        const base64Data = image_url.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${user.id}/${Date.now()}.jpg`
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('tryon-results')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            })
            
        if (uploadError) {
             console.error("Upload error:", uploadError)
             return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
        }
        
        const { data: { publicUrl } } = supabase.storage.from('tryon-results').getPublicUrl(fileName)
        finalImageUrl = publicUrl
    }

    const { data, error } = await supabase
      .from("saved_tryons")
      .insert({
        profile_id: user.id,
        prenda_id,
        image_url: finalImageUrl,
        tryon_type,
        metadata
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error("Error saving tryon:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  
  // Optional: Delete image from storage if needed, but keeping it simple for now just deleting the record
  
  const { error } = await supabase
    .from("saved_tryons")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
