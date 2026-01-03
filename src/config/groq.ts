// Groq AI configuration using OpenAI-compatible API
import OpenAI from 'openai';

// Lazy initialization to avoid loading SDK at module import time
let groqClientInstance: OpenAI | null = null;

// Factory to get Groq client instance
export function getGroqClient(): OpenAI {
    if (!groqClientInstance) {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_GROQ_API_KEY is not configured');
        }
        groqClientInstance = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true, // Required for client-side usage
        });
    }
    return groqClientInstance;
}

// Helper function to generate content using Groq
export async function generateWithGroq(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<string> {
    const response = await getGroqClient().chat.completions.create({
        model: options?.model || 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content || '';
}

// Available Groq models:
// - llama-3.3-70b-versatile (recommended for complex tasks)
// - llama-3.1-8b-instant (faster, smaller)
// - mixtral-8x7b-32768 (good balance)
// - gemma2-9b-it (Google's Gemma)
