import { randomUUID } from 'crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inboundRequestId = req.headers['x-request-id'];
    const requestId =
      typeof inboundRequestId === 'string' && inboundRequestId.trim().length > 0
        ? inboundRequestId
        : randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
