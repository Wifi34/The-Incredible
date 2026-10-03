import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModels() {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3.8-flash'];
  for (const m of models) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: 'Analyze this issue: "Bada khadda hai road par". Return JSON with category and severity.'
      });
      console.log(`✅ Model ${m} worked!`);
      console.log(response.text);
      return m;
    } catch (err) {
      console.log(`❌ Model ${m} error:`, err.message);
    }
  }
}

testModels();
