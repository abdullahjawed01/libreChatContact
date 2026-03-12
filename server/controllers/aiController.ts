import type { Request, Response } from 'express';
import { processAIQuery } from '../services/aiService.js';

export const askAssistant = async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Query required' });

    const answer = await processAIQuery(query);
    res.json({ answer });
};
