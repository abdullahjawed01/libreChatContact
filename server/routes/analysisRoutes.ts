import { Router } from 'express';
import { campaignInsights } from '../controllers/analysisController.js';

const router = Router();

// GET /api/analysis/campaign-insights
router.get('/campaign-insights', campaignInsights);

export default router;
