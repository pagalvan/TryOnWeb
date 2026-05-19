const fs = require('fs');
const path = require('path');
const https = require('https');

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
  process.exit(1);
}

if (!apiKey) {
  console.error("API Key not found in .env.local");
  process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log("Available Models:");
        if (json.models) {
            json.models.forEach(m => {
                console.log(`- ${m.name} (Supported methods: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("No models found in response:", json);
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    } else {
      console.error(`Error: Status Code ${res.statusCode}`);
      console.error("Response:", data);
    }
  });

}).on('error', (err) => {
  console.error("Error fetching models:", err.message);
});
