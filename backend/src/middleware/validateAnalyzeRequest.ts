import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler.js';

export const validateAnalyzeRequest = (req: Request, _res: Response, next: NextFunction) => {
  const { contractText, userRole } = req.body ?? {};

  if (typeof contractText !== 'string' || !contractText.trim()) {
    return next(new HttpError(400, 'contractText must be a non-empty string'));
  }

  if (typeof userRole !== 'string' || !userRole.trim()) {
    return next(new HttpError(400, 'userRole must be a non-empty string'));
  }

  if (contractText.length > 100000) {
    return next(new HttpError(413, 'contractText is too large'));
  }

  return next();
};