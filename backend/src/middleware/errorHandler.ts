import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, 'Route not found'));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  const message = err instanceof Error ? err.message : 'An unexpected server error occurred';
  return res.status(500).json({ success: false, error: message });
};