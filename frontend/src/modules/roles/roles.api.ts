import { baseApi } from '@/store/api';

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  _count?: { users: number; permissions: number };
}

interface CreateRoleDto {
  name: string;
  description?: string;
}

interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => '/roles',
      transformResponse: (response: { data: Role[] }) => response.data,
      providesTags: ['Roles'],
    }),
    getRolesSelect: builder.query<{ id: string; name: string }[], void>({
      query: () => '/roles/select',
      transformResponse: (response: { data: { id: string; name: string }[] }) => response.data,
      providesTags: ['Roles'],
    }),
    getRole: builder.query<Role, string>({
      query: (id) => `/roles/${id}`,
      transformResponse: (response: { data: Role }) => response.data,
      providesTags: (_result, _err, id) => [{ type: 'Roles', id }],
    }),
    getRolePermissions: builder.query<Permission[], string>({
      query: (roleId) => `/roles/${roleId}/permissions`,
      transformResponse: (response: { data: Permission[] }) => response.data,
      providesTags: (_result, _err, id) => [{ type: 'Roles', id }],
    }),
    createRole: builder.mutation<{ data: Role; message: string }, CreateRoleDto>({
      query: (body) => ({ url: '/roles', method: 'POST', body }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation<{ data: Role; message: string }, { id: string; body: UpdateRoleDto }>({
      query: ({ id, body }) => ({ url: `/roles/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Roles'],
    }),
    assignPermissions: builder.mutation<{ message: string }, { roleId: string; permissionIds: string[] }>({
      query: ({ roleId, permissionIds }) => ({
        url: `/roles/${roleId}/permissions`,
        method: 'POST',
        body: { permissionIds },
      }),
      invalidatesTags: ['Roles'],
    }),
    getPermissions: builder.query<Permission[], void>({
      query: () => '/permissions',
      transformResponse: (response: { data: Permission[] }) => response.data,
      providesTags: ['Permissions'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRolesSelectQuery,
  useGetRoleQuery,
  useGetRolePermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignPermissionsMutation,
  useGetPermissionsQuery,
} = rolesApi;
