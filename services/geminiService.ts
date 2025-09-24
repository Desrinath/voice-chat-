
import { GoogleGenAI, Chat } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const initializeChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a helpful and friendly voice assistant. Provide concise and clear answers.',
    },
  });
};

export const getAiResponse = async (chat: Chat, prompt: string): Promise<string> => {
  try {
    const response = await chat.sendMessage({ message: prompt });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    // Potentially re-throw or handle specific errors
    throw new Error("Failed to get response from AI model.");
  }
};
