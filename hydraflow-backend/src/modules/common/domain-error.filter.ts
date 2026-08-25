import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from './domain-error';

function formatHttpExceptionBody(
  body: string | object,
): { error: string } & Record<string, unknown> {
  if (typeof body === 'string') {
    return { error: body };
  }

  const record = body as Record<string, unknown>;
  const message = record.message;

  if (Array.isArray(message)) {
    return { error: message.join('; '), ...record };
  }
  if (typeof message === 'string') {
    return { error: message, ...record };
  }
  if (typeof record.error === 'string') {
    return { error: record.error, ...record };
  }

  return { error: 'Bad request', ...record };
}

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.status).json({ error: exception.message });
  }
}

@Catch()
export class FallbackExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(formatHttpExceptionBody(exception.getResponse()));
      return;
    }

    console.error('Unhandled error:', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
  }
}
