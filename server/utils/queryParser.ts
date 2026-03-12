import axios from 'axios';

export interface Filters {
    company?: string;
    role?: string;
    name?: string;
    attributes?: Record<string, string>;
    searchTerm?: string;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Use the LLM to intelligently extract the core intent and keywords from the user's natural language
// This acts as a vastly superior parser replacing the naive regex implementation.
export const parseQuery = async (text: string): Promise<Filters> => {
    try {
        const extractionPrompt = `
        You are an intelligent natural language parsing engine. 
        Extract the core search variables from the user's query about their contacts.
        Return ONLY a JSON object exactly matching this structure (omit fields if not explicitly mentioned).
        Do not use markdown blocks, just raw JSON text. Example output: {"company":"Acme Corp", "role":"CTO"}
        
        Query: "${text}"
        `;

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
            { contents: [{ parts: [{ text: extractionPrompt }] }] }
        );

        let jsonRaw = response.data.candidates[0].content.parts[0].text;
        jsonRaw = jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        const extracted = JSON.parse(jsonRaw);

        return {
            company: extracted.company,
            role: extracted.role,
            name: extracted.name,
            searchTerm: text // Keep original text as fallback global search
        };
    } catch (error) {
        console.error("LLM Parse Error, falling back to basic:", error);
        // Fallback basic parse if LLM fails
        return { searchTerm: text };
    }
};
