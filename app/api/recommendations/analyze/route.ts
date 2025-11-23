import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

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
    const { imageUrl } = await req.json();

    console.log("Analyzing image:", imageUrl);

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch image:", imageResponse.status, imageResponse.statusText);
      return NextResponse.json({ error: `Failed to fetch image: ${imageResponse.statusText}` }, { status: 400 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    console.log("Image fetched and converted to base64, length:", base64Image.length);

    const prompt = `
      You are a professional fashion stylist and image consultant AI. Analyze this image of a person trying on clothes (virtual try-on).
      Provide a comprehensive analysis including:
      1. Colorimetry Analysis: Determine the user's seasonal color palette (e.g., Winter, Summer, Autumn, Spring) based on skin tone, hair, and eyes. Suggest the best colors for them.
      2. Size & Fit Recommendation: Estimate the user's body type and suggest the best fit (e.g., Slim, Regular, Oversized) and general sizing advice for the item they are wearing. Also provide an estimated size range (e.g., "S-M", "L-XL", "38-40").
      3. Style Recommendations: Suggest 3 matching items that would complete the look.

      IMPORTANT: All text fields (descriptions, reasons, advice, etc.) MUST be in Spanish.

      Return ONLY a valid JSON object (no markdown formatting) with the following structure:
      {
        "colorimetry": {
          "season": "Season Name (in Spanish)",
          "bestColors": ["Color 1", "Color 2", "Color 3"],
          "description": "Brief explanation of why these colors work (in Spanish)"
        },
        "sizeRecommendation": {
          "fit": "Recommended Fit (e.g. Slim Fit) (in Spanish)",
          "sizeRange": "Estimated Size Range (e.g. M-L, 32-34)",
          "advice": "Specific sizing advice based on visual body type analysis (in Spanish)"
        },
        "styleRecommendations": [
          {
            "name": "Item Name (in Spanish)",
            "category": "Category (in Spanish)",
            "reason": "Why this matches (in Spanish)",
            "confidence": 85
          }
        ]
      }
    `;

    const inputData = [
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];

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
    
    try {
      const data = JSON.parse(jsonString);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }

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
