
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getStampMotivation(stampIndex: number, totalStamps: number) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User just collected stamp #${stampIndex + 1} out of ${totalStamps}. 
                 Give a short, enthusiastic, one-sentence motivational message in Traditional Chinese (Taiwan). 
                 Then give a very short "Did you know?" fun fact about stamp collecting.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            encouragement: { type: Type.STRING }
          },
          required: ["message", "encouragement"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      message: "太棒了！繼續加油！",
      encouragement: "你知道嗎？世界上第一枚郵票是 1840 年發行的黑便士。"
    };
  }
}
