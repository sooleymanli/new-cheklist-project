import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',
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

  const requestUrl = typeof args === 'string' ? args : args.url;
  const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

  if (result.error && result.error.status === 401 && !isAuthRequest) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        // refresh token is sent automatically via httpOnly cookie
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions,
        );
        if (refreshResult.data) {
          const data = (refreshResult.data as any).data;
          localStorage.setItem('accessToken', data.accessToken);
          isRefreshing = false;
          return true;
        } else {
          localStorage.removeItem('accessToken');
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
    'InspectionAssignments',
    'ApprovalHistory',
    'Incidents',
    'Notifications',
    'Dashboard',
  ],
  endpoints: () => ({}),
});
