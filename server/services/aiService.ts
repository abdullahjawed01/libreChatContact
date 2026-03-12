import axios from 'axios';
import Contact from '../models/Contact.js';
import { parseQuery } from '../utils/queryParser.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export const processAIQuery = async (userQuery: string): Promise<string> => {
    try {
        // 1. LLM-Assisted Parsing of the intent
        const filters = await parseQuery(userQuery);

        // 2. Targeted DB Retrieval (Assignment Bonus Goal achieved here)
        let query: any = {};

        if (filters.company || filters.role || filters.name) {
            let conditions = [];
            if (filters.company) conditions.push({ company: new RegExp(filters.company, 'i') });
            if (filters.role) conditions.push({ role: new RegExp(filters.role, 'i') });
            if (filters.name) conditions.push({ name: new RegExp(filters.name, 'i') });
            if (conditions.length > 0) query.$or = conditions;
        } else {
            // Fallback to generic text index search across all mapped fields if no specific fields were intelligently extracted
            query.$text = { $search: filters.searchTerm || userQuery };
        }

        // Limit retrieval to top matches to preserve token limits while providing context
        const contacts = await Contact.find(query).limit(10).lean();

        // 3. Construct intelligent context prompt
        let contactsContext = '';
        if (contacts.length > 0) {
            contactsContext = contacts.map(c => {
                let contextStr = `- ${c.name} (${c.role || 'No Role'} at ${c.company || 'Unknown Company'}). `;
                contextStr += `Email: ${c.email}. `;
                if (c.notes) contextStr += `Notes: ${c.notes}. `;
                if (c.attributes) {
                    const attrs = Object.entries(c.attributes).map(([k, v]) => `${k}:${v}`).join(', ');
                    contextStr += `Additional Fields: [${attrs}].`;
                }
                return contextStr;
            }).join('\n');
        } else {
            contactsContext = 'No matching contacts found in the database. Rely on general AI knowledge if appropriate, or state that you could not find internal data for that person/company.';
        }

        const prompt = `
        You are the LibreChat Contact Workspace Assistant. Your job is exclusively to answer questions about the stored contacts.
        Use ONLY the following retrieved database documents to answer the user's question. Be accurate, concise, and helpful.
        Format your response using clean Markdown. Use **bold** for names or important terms, and use lists for multiple contacts. Do not use raw asterisks loosely.
        If the relevant data is not in the context, clearly stating you don't know based on the provided contacts.
        
        --- DATABASE CONTEXT START ---
        ${contactsContext}
        --- DATABASE CONTEXT END ---
        
        User Question: ${userQuery}
        `;

        // 4. Call Gemini API to generate the final response
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (error: any) {
        console.error('AI Service Error:', error.message);
        return "CRITICAL ERROR: Nexus Intelligence connection failed. Unable to fetch or process telemetry. " + error.message;
    }
};
