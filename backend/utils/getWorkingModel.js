const MODEL_FALLBACKS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-1.5-pro"
];


function isRetryable(err){
  return (
    err?.status === 503 ||
    err?.message?.includes("high demand") ||
    err?.message?.includes("Service Unavailable")
  );
}

async function generateWithFallback(genAI, prompt){

  let lastError;

  for (const modelName of MODEL_FALLBACKS){

    try {

      console.log("Trying model:", modelName);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig:{
          temperature:0.4,
          topP:0.9
        }
      });

      return await model.generateContent(prompt);

    } catch(err){

      console.warn(
        `${modelName} failed`,
        err.message
      );

      lastError = err;

      if(!isRetryable(err)){
        throw err;
      }

      // fallback to next model
    }
  }

  throw lastError;
}
export default generateWithFallback;