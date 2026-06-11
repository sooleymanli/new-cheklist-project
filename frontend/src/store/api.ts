import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const lang = localStorage.getItem('language') || 'az';
    headers.set('Accept-Language', lang);
    return headers;
  },
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return result;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          const data = (refreshResult.data as any).data;
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          isRefreshing = false;
          return true;
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          isRefreshing = false;
          window.location.href = '/login';
          return false;
        }
      })();
    }

    const success = await refreshPromise;
    if (success) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Users',
    'Roles',
    'Permissions',
    'Buildings',
    'Floors',
    'Locations',
    'ChecklistTemplates',
    'ChecklistInstances',
    'Incidents',
    'Notifications',
    'Dashboard',
  ],
  endpoints: () => ({}),
});
