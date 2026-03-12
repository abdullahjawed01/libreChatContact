import type { Request, Response } from 'express';
import { getCampaignInsights } from '../services/analysisService.js';

/**
 * GET /api/analysis/campaign-insights
 * Returns segmented campaign data from MongoDB aggregation pipelines.
 */
export const campaignInsights = async (req: Request, res: Response) => {
    try {
        const insights = await getCampaignInsights();
        res.json(insights);
    } catch (err: any) {
        console.error('Analysis error:', err.message);
        res.status(500).json({ message: 'Failed to generate campaign insights: ' + err.message });
    }
};
