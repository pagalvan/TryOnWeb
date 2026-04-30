import { NextRequest, NextResponse } from 'next/server';
import { client } from "@gradio/client";

export async function POST(req: NextRequest) {
  try {
    const { personImage, garmentImage } = await req.json();

    if (!personImage || !garmentImage) {
      return NextResponse.json(
        { error: 'Both person and garment images are required' },
        { status: 400 }
      );
    }

    // Connect to the IDM-VTON space on Hugging Face
    // This is a specialized Virtual Try-On model that actually generates images
    // unlike Gemini which is text-based.
    console.log("Connecting to IDM-VTON space...");
    const app = await client("yisol/IDM-VTON");

    // Convert base64 to Blob/File for Gradio
    // Gradio client usually accepts URLs or Blobs. 
    // Since we have base64, we might need to convert or pass as data URL if supported.
    // The client often handles data URLs directly or we can pass them as string.
    
    // Note: The IDM-VTON API expects:
    // 0: dict (background, layers, composite) - for person image
    // 1: filepath - for garment image
    // 2: text - description
    // 3: bool - is_checked
    // 4: bool - is_checked_crop
    // 5: number - denoise_steps
    // 6: number - seed
    
    // We need to format the inputs correctly.
    // For the person image, it expects a dictionary because it has a masking tool in the UI.
    // We can try passing the image URL/Base64 directly if the API allows, or construct the object.
    
    // Let's try a simpler VTON space if this one is too complex, 
    // OR try to map our inputs.
    // "yisol/IDM-VTON" is the best quality but complex input.
    // Let's try "levihsu/OOTDiffusion" or similar if easier? 
    // No, let's try to make IDM-VTON work.
    
    // We will pass the person image as the "background" of the dict.
    
    const personInput = {
        "background": await (await fetch(personImage)).blob(),
        "layers": [],
        "composite": null
    };
    
    const garmentInput = await (await fetch(garmentImage)).blob();

    console.log("Sending request to Gradio...");
    
    const result = await app.predict("/tryon", [
        personInput, 		// dict(background, layers, composite)
        garmentInput, 		// filepath/blob
        "virtual try on", 	// string  in 'Description' Textbox component
        true, 				// boolean  in 'Auto-crop & Resize' Checkbox component
        true, 				// boolean  in 'Use auto-generated mask' Checkbox component
        30, 				// number  in 'Denoising Steps' Slider component
        42, 				// number  in 'Seed' Number component
    ]);

    // The result is usually an array with the output image info
    // result.data[0] should be the image
    console.log("Gradio result received");
    const resultData = result?.data as any[] | undefined;
    
    if (resultData && resultData[0]) {
        // The output might be a URL or a Blob/File object depending on the client version
        // We need to convert it back to base64 to send to client
        const output = resultData[0];
        
        if (output.url) {
             return NextResponse.json({ result: output.url });
        }
        
        // If it's a blob/buffer
        // We might need to handle it.
        // For now, let's assume it returns a URL or we can inspect it.
        // If it returns a file object with 'data' property (base64)
        if (output.data) {
             return NextResponse.json({ result: output.data });
        }
        
        // Fallback
        return NextResponse.json({ result: output });
    }

    throw new Error("No image generated");

  } catch (error: any) {
    console.error('Error processing with Gradio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process images' },
      { status: 500 }
    );
  }
}
