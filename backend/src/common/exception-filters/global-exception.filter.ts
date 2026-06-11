import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { i18nService } from '../../shared/i18n/i18n.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const locale = i18nService.getLocaleFromRequest(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'error.internal';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || message;
        errors = Array.isArray(res.message) ? res.message : [];
        if (errors.length > 0) {
          message = 'validation.failed';
        }
      }
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      success: false,
      message: i18nService.translate(message, locale),
      errors,
      statusCode: status,
    });
  }
}
