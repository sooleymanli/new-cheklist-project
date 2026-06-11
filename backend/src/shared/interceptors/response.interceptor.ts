import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { i18nService } from '../i18n/i18n.service';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const locale = i18nService.getLocaleFromRequest(request);

    return next.handle().pipe(
      map((data) => {
        // If the service returns { data, meta } for paginated results
        if (data && data.data !== undefined && data.meta !== undefined) {
          return {
            success: true,
            data: data.data,
            meta: data.meta,
            ...(data.message && { message: i18nService.translate(data.message, locale, data.messageParams) }),
          };
        }
        // If the service returns { message, ...rest } pattern
        if (data && data.message && typeof data.message === 'string') {
          const { message, messageParams, ...rest } = data;
          const hasOtherKeys = Object.keys(rest).length > 0;
          return {
            success: true,
            data: hasOtherKeys ? rest : null,
            message: i18nService.translate(message, locale, messageParams),
          } as any;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
