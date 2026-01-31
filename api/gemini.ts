
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
    // This serverless function prevents the browser from having to reference 'process' or 'env',
    // which fixes common black screen issues caused by client-side reference errors.
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are a professional CRM intelligence agent. Generate a concise, one-sentence professional summary for a lead based on the provided company name and business type. Focus on business value and opportunities."
    });

    // In @google/generative-ai, contents should be a string or array of parts
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("Gemini Serverless Error:", error);
    return res.status(500).json({
      error: "Command Center communication failure",
      details: error.message
    });
  }
}
