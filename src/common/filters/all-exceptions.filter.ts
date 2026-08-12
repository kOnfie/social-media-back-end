import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';

interface PostgresError {
  code: string;
  detail?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const postgresErrorCodes: Record<string, { status: number; msg: string }> =
      {
        '23505': { status: HttpStatus.CONFLICT, msg: 'Record already exists' },
        '23503': {
          status: HttpStatus.BAD_REQUEST,
          msg: 'Помилка зв’язків у базі',
        },
        '23502': {
          status: HttpStatus.BAD_REQUEST,
          msg: 'Пропущено обов’язкове поле',
        },
      };

    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    const stack: string | undefined =
      exception instanceof Error ? exception.stack : undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof QueryFailedError) {
      const error = exception as unknown as PostgresError;

      const pgError = postgresErrorCodes[error.code];
      if (pgError) {
        status = pgError.status;
        message = pgError.msg;
      }

      this.logger.error(`Postgres error detail: ${error.detail}`);
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
      stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: message,
    });
  }
}
