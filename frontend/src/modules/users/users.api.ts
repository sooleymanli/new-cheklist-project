import { baseApi } from '@/store/api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  position?: string;
  isActive: boolean;
  role: { id: string; name: string };
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface UserQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  status?: 'active' | 'inactive';
}

interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
  position?: string;
  roleId: string;
}

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  position?: string;
  roleId?: string;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, UserQuery>({
      query: (params) => ({ url: '/users', params }),
      transformResponse: (response: { data: User[]; meta: UsersResponse['meta'] }) => response,
      providesTags: ['Users'],
    }),
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: { data: User }) => response.data,
      providesTags: (_result, _err, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation<{ data: User; message: string }, CreateUserDto>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation<{ data: User; message: string }, { id: string; body: UpdateUserDto }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Users'],
    }),
    activateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Users'],
    }),
    deactivateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} = usersApi;
