import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  updateApiKey(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateSpeech(
    text: string,
    voiceName: string,
    language: string,
    emotion: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error("API Key not set");
    }

    // Construct a prompt that guides the model to speak in the specific language and style
    // Note: The model 'gemini-2.5-flash-preview-tts' takes text and generates audio.
    // We can use the text prompt to influence language and emotion.
    const prompt = `Say the following in ${language}, with a ${emotion} tone: "${text}"`;

    try {
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio data received from Gemini");
      }

      return base64Audio;
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      throw error;
    }
  }
}