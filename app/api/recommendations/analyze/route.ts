import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    // Manual fallback: Read .env.local directly if process.env fails
    let apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      console.log("Process env missing key, attempting manual file read...");
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const match = envContent.match(/^GOOGLE_GEMINI_API_KEY=(.*)$/m);
          if (match) {
            apiKey = match[1].trim();
            console.log("Manually loaded API Key from file.");
          }
        }
      } catch (err) {
        console.error("Manual file read failed:", err);
      }
    }
    
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY is strictly missing.");
      return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
    }

    console.log("API Key found (length):", apiKey.length);

    const genAI = new GoogleGenerativeAI(apiKey);
    const { imageUrl, measurements } = await req.json();

    console.log("Analyzing request. Image:", imageUrl ? "Yes" : "No", "Measurements:", measurements ? "Yes" : "No");

    if (!imageUrl && !measurements) {
      return NextResponse.json({ error: 'Either Image URL or Measurements are required' }, { status: 400 });
    }

    // 1. Fetch Available Inventory & User Favorites
    const supabase = getSupabaseAdminClient()
    const user = await getAuthenticatedUser()

    // Fetch favorites if user is logged in
    let favoriteCategories: string[] = [];
    if (user) {
      const { data: favorites } = await supabase
        .from('product_favorites')
        .select('prenda:prendas(categoria:categorias(nombre))')
        .eq('profile_id', user.id);
      
      if (favorites) {
        favoriteCategories = favorites
          .map((f: any) => {
            const cat = f.prenda?.categoria;
            return Array.isArray(cat) ? cat[0]?.nombre : cat?.nombre;
          })
          .filter(Boolean);
        
        // Deduplicate
        favoriteCategories = Array.from(new Set(favoriteCategories));
      }
    }

    const { data: products } = await supabase
      .from('prendas')
      .select('id, nombre, categoria:categorias(nombre), color, tipo_prenda, descripcion')
      .eq('estado', 'disponible')
      .limit(50) // Limit context window usage

    const productContext = products?.map(p => {
      const cat: any = p.categoria;
      return {
        id: p.id,
        name: p.nombre,
        category: Array.isArray(cat) ? cat[0]?.nombre : cat?.nombre || p.tipo_prenda,
        color: p.color,
        description: p.descripcion
      };
    }) || []

    let base64Image = null;
    if (imageUrl) {
      // Fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error("Failed to fetch image:", imageResponse.status, imageResponse.statusText);
        return NextResponse.json({ error: `Failed to fetch image: ${imageResponse.statusText}` }, { status: 400 });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      base64Image = Buffer.from(imageBuffer).toString('base64');
      console.log("Image fetched and converted to base64, length:", base64Image.length);
    }

    let prompt = `
      You are a professional fashion stylist and image consultant AI.
    `;

    if (measurements) {
      prompt += `
      The user has provided the following body measurements:
      - Height: ${measurements.altura_cm} cm
      - Weight: ${measurements.peso_kg} kg
      - Chest: ${measurements.pecho_cm} cm
      - Waist: ${measurements.cintura_cm} cm
      - Hips: ${measurements.cadera_cm} cm
      - Build: ${measurements.complexion}
      
      Based on these measurements, calculate the most accurate clothing size (International Standard S, M, L, XL, etc.) and numeric size (EU/US).
      `;
    }

    if (favoriteCategories.length > 0) {
      prompt += `
      USER PREFERENCES:
      The user has previously liked/favorited items in the following categories: ${favoriteCategories.join(', ')}.
      Please prioritize recommending items from these categories IF they match the style and colorimetry analysis. Do not force them if they are a bad match, but give them preference.
      `;
    }

    if (base64Image) {
      prompt += `
      Analyze this image of a person trying on clothes (virtual try-on).
      Provide a comprehensive analysis including:
      1. Colorimetry Analysis: Determine the user's seasonal color palette (e.g., Winter, Summer, Autumn, Spring) based on skin tone, hair, and eyes. Suggest the best colors for them.
      `;
    }

    prompt += `
      2. Size & Fit Recommendation: Estimate the user's body type and suggest the best fit (e.g., Slim, Regular, Oversized) and general sizing advice. Also provide an estimated size range (e.g., "S-M", "L-XL", "38-40").
      3. Style Recommendations: Select 3 matching items from the provided "Available Inventory" list below that would complete the look.
      
      AVAILABLE INVENTORY (JSON):
      ${JSON.stringify(productContext)}

      IMPORTANT: 
      - All text fields (descriptions, reasons, advice, etc.) MUST be in Spanish.
      - For "styleRecommendations", you MUST select items from the provided inventory list.
      - Include the exact "id" of the selected product in the response.

      Return ONLY a valid JSON object (no markdown formatting) with the following structure:
      {
        "colorimetry": {
          "season": "Season Name (in Spanish) (or 'N/A' if no image)",
          "bestColors": ["Color 1", "Color 2", "Color 3"],
          "description": "Brief explanation of why these colors work (in Spanish) (or 'N/A' if no image)"
        },
        "sizeRecommendation": {
          "fit": "Recommended Fit (e.g. Slim Fit) (in Spanish)",
          "sizeRange": "Estimated Size Range (e.g. M-L, 32-34)",
          "advice": "Specific sizing advice based on measurements (if provided) or visual analysis (in Spanish)"
        },
        "styleRecommendations": [
          {
            "id": "UUID from inventory list",
            "name": "Item Name (in Spanish)",
            "category": "Category (in Spanish)",
            "reason": "Why this matches (in Spanish)",
            "confidence": 85
          }
        ]
      }
    `;

    const inputData: any[] = [prompt];
    
    if (base64Image) {
      inputData.push({
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      });
    }

    // Try multiple models in sequence until one works
    // Based on available models for this API key (checked via script)
    const modelCandidates = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash-exp",
      "gemini-2.0-pro-exp"
    ];
    let result;
    let lastError;

    for (const modelName of modelCandidates) {
      try {
        console.log(`Attempting with model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(inputData);
        console.log(`Success with model: ${modelName}`);
        break; 
      } catch (e: any) {
        const isRateLimit = e.status === 429 || e.message?.includes("429") || e.message?.includes("Too Many Requests");
        
        if (isRateLimit) {
          console.log(`Model ${modelName} rate limited. Retrying in 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            result = await model.generateContent(inputData);
            console.log(`Success with model: ${modelName} (after retry)`);
            break;
          } catch (retryError: any) {
            console.error(`Model ${modelName} failed after retry:`, retryError.message);
            lastError = retryError;
          }
        } else {
          console.error(`Model ${modelName} failed:`, e.message);
          lastError = e;
        }
      }
    }

    if (!result) {
      console.error("All models failed.");
      throw lastError;
    }

    const response = await result.response;
    const text = response.text();
    
    // Clean up the response if it contains markdown code blocks
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }

    // 2. Save Recommendation to DB (if user is logged in)
    if (user) {
      try {
        // A. Create Run
        const { data: run, error: runError } = await supabase
          .from('recommendation_runs')
          .insert({
            estrategia: 'ai-gemini-inventory-aware',
            ejecutado_por: user.id,
            parametros: { measurements, hasImage: !!imageUrl }
          })
          .select()
          .single();

        if (runError) throw new Error(`Run creation failed: ${runError.message}`);

        // B. Create Recommendation
        const { data: recommendation, error: recError } = await supabase
          .from('recommendations')
          .insert({
            profile_id: user.id,
            run_id: run.id,
            tipo: 'automatica',
            estado: 'activa',
            contexto: {
              colorimetry: data.colorimetry,
              size: data.sizeRecommendation
            },
            mensaje: data.colorimetry?.description || "Recomendación basada en tu análisis."
          })
          .select()
          .single();

        if (recError) throw new Error(`Recommendation creation failed: ${recError.message}`);

        // C. Create Recommendation Items
        if (data.styleRecommendations && Array.isArray(data.styleRecommendations)) {
          const itemsToInsert = data.styleRecommendations
            .filter((item: any) => item.id) // Ensure ID exists
            .map((item: any) => ({
              recommendation_id: recommendation.id,
              prenda_id: item.id,
              score: item.confidence,
              razon: item.reason,
              metadata: { name: item.name, category: item.category }
            }));

          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from('recommendation_items')
              .insert(itemsToInsert);
            
            if (itemsError) console.error("Failed to save recommendation items:", itemsError);
          }
        }
      } catch (dbError) {
        console.error("Database saving error:", dbError);
        // Don't fail the request if saving fails, just log it
      }
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in recommendation API:', error);
    const errorMessage = error?.message || "Unknown error";
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage,
      stack: error?.stack 
    }, { status: 500 });
  }
}
