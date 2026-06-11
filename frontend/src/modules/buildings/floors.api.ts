import { baseApi } from '@/store/api';

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  isActive: boolean;
  building?: { id: string; name: string };
  _count?: { locations: number };
}

interface CreateFloorDto {
  buildingId: string;
  name: string;
  description?: string;
}

export const floorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFloors: builder.query<Floor[], { buildingId?: string }>({
      query: (params) => ({ url: '/floors', params }),
      transformResponse: (response: { data: Floor[] }) => response.data,
      providesTags: ['Floors'],
    }),
    getFloor: builder.query<Floor, string>({
      query: (id) => `/floors/${id}`,
      transformResponse: (response: { data: Floor }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'Floors', id }],
    }),
    createFloor: builder.mutation<Floor, CreateFloorDto>({
      query: (body) => ({ url: '/floors', method: 'POST', body }),
      invalidatesTags: ['Floors'],
    }),
    updateFloor: builder.mutation<Floor, { id: string; body: Partial<Omit<CreateFloorDto, 'buildingId'>> }>({
      query: ({ id, body }) => ({ url: `/floors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Floors'],
    }),
    deleteFloor: builder.mutation<void, string>({
      query: (id) => ({ url: `/floors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Floors'],
    }),
    activateFloor: builder.mutation<Floor, string>({
      query: (id) => ({ url: `/floors/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Floors'],
    }),
    deactivateFloor: builder.mutation<Floor, string>({
      query: (id) => ({ url: `/floors/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['Floors'],
    }),
  }),
});

export const {
  useGetFloorsQuery,
  useGetFloorQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
  useActivateFloorMutation,
  useDeactivateFloorMutation,
} = floorsApi;
