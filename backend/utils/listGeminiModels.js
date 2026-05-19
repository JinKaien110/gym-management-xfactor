import dotenv from "dotenv"
dotenv.config()
const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    console.error("ListModels failed:", data);
    process.exit(1);
  }

  const models = (data.models ?? []).map(m => ({
    name: m.name, // e.g. "models/gemini-2.0-flash"
    displayName: m.displayName,
    methods: m.supportedGenerationMethods ?? []
  }));

  // show only models that support generateContent
  const usable = models.filter(m => m.methods.includes("generateContent"));

  console.table(usable);
}

listModels();
