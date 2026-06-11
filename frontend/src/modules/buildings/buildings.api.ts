import { baseApi } from '@/store/api';

export interface Building {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { floors: number; locations: number };
}

interface BuildingsResponse {
  data: Building[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface BuildingQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: string;
}

interface CreateBuildingDto {
  name: string;
  description?: string;
}

export const buildingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBuildings: builder.query<BuildingsResponse, BuildingQuery>({
      query: (params) => ({ url: '/buildings', params }),
      transformResponse: (response: { data: Building[]; meta: BuildingsResponse['meta'] }) => response,
      providesTags: ['Buildings'],
    }),
    getBuilding: builder.query<Building, string>({
      query: (id) => `/buildings/${id}`,
      transformResponse: (response: { data: Building }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'Buildings', id }],
    }),
    createBuilding: builder.mutation<Building, CreateBuildingDto>({
      query: (body) => ({ url: '/buildings', method: 'POST', body }),
      invalidatesTags: ['Buildings'],
    }),
    updateBuilding: builder.mutation<Building, { id: string; body: Partial<CreateBuildingDto> }>({
      query: ({ id, body }) => ({ url: `/buildings/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Buildings'],
    }),
    deleteBuilding: builder.mutation<void, string>({
      query: (id) => ({ url: `/buildings/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Buildings'],
    }),
    activateBuilding: builder.mutation<Building, string>({
      query: (id) => ({ url: `/buildings/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Buildings'],
    }),
    deactivateBuilding: builder.mutation<Building, string>({
      query: (id) => ({ url: `/buildings/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['Buildings'],
    }),
  }),
});

export const {
  useGetBuildingsQuery,
  useGetBuildingQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
  useActivateBuildingMutation,
  useDeactivateBuildingMutation,
} = buildingsApi;
