import { baseApi } from '@/store/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { id: string; name: string };
    permissions: string[];
  };
}

interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; name: string };
  permissions: string[];
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: { data: LoginResponse }) => response.data,
    }),
    getProfile: builder.query<ProfileResponse, void>({
      query: () => '/auth/me',
      transformResponse: (response: { data: ProfileResponse }) => response.data,
    }),
    refreshToken: builder.mutation<{ accessToken: string }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      transformResponse: (response: { data: { accessToken: string } }) => response.data,
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useLoginMutation, useGetProfileQuery, useRefreshTokenMutation, useLogoutMutation } = authApi;
