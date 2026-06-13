import { Router } from 'express';
import { analyzeWithGemini } from '../services/gemini.js';
import { validateAnalyzeRequest } from '../middleware/validateAnalyzeRequest.js';
import { HttpError } from '../middleware/errorHandler.js';

export const aiRouter = Router();

aiRouter.post('/analyze', validateAnalyzeRequest, async (req, res, next) => {
  try {
    const { contractText, userRole } = req.body as { contractText: string; userRole: string };
    const data = await analyzeWithGemini(contractText, userRole);

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return next(error);
    }

    return next(new HttpError(500, error instanceof Error ? error.message : 'Failed to analyze contract'));
  }
});