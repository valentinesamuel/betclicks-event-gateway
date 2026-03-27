import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TRACE_ID_HEADER } from '../constants';

declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const traceId = (req.headers[TRACE_ID_HEADER] as string) || uuidv4();
    req.traceId = traceId;
    res.setHeader(TRACE_ID_HEADER, traceId);
    next();
  }
}
