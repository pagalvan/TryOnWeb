const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testImageGen() {
  // Read .env.local manually
  const envPath = path.join(__dirname, '..', '.env.local');
  let apiKey = '';
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_GEMINI_API_KEY=(.*)/);
    if (match && match[1]) {
      apiKey = match[1].trim();
    }
  } catch (e) {
    console.error("Could not read .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try the specific image generation model found in the list
  const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" }); // Trying a common imagen name, or fallback to the one in list if I can recall it exactly.
  // Wait, the list had: models/imagen-4.0-generate-preview-06-06
  // And: models/gemini-2.0-flash-exp-image-generation
  
  const modelName = "gemini-2.0-flash-exp"; // Let's stick to the one we know works for text, but ask for image?
  // Actually, let's try the specific one from the list
  const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); 
  
  const prompt = "Generate an image of a futuristic fashion sneaker in neon blue and silver colors. Photorealistic.";

  try {
    console.log("Attempting to generate image with gemini-2.0-flash-exp...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log("Response received.");
    console.log(JSON.stringify(response, null, 2));
    
    // Check if there are images in the response
    // Usually they come as inline data or similar in the candidates
  } catch (e) {
    console.error("Error generating image:", e.message);
  }
}

testImageGen();
