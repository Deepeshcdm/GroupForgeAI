// Google Gemini AI configuration for skill assessments
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization to avoid loading SDK at module import time
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('VITE_GEMINI_API_KEY is not configured');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// Factory for adaptive skill assessments model
export function getAssessmentModel() {
    return getGenAI().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
        },
    });
}

// Factory for resume/CV analysis model
export function getResumeAnalysisModel() {
    return getGenAI().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
        },
    });
}

// Factory for team formation reasoning model
export function getTeamFormationModel() {
    return getGenAI().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.5,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
        },
    });
}

export default getGenAI;
