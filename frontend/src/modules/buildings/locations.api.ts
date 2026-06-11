import { baseApi } from '@/store/api';

export interface Location {
  id: string;
  buildingId: string;
  floorId?: string;
  name: string;
  description?: string;
  isActive: boolean;
  building?: { id: string; name: string };
  floor?: { id: string; name: string };
}

interface CreateLocationDto {
  buildingId: string;
  floorId?: string;
  name: string;
  description?: string;
}

export const locationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLocations: builder.query<Location[], { buildingId?: string; floorId?: string }>({
      query: (params) => ({ url: '/locations', params }),
      transformResponse: (response: { data: Location[] }) => response.data,
      providesTags: ['Locations'],
    }),
    createLocation: builder.mutation<Location, CreateLocationDto>({
      query: (body) => ({ url: '/locations', method: 'POST', body }),
      invalidatesTags: ['Locations'],
    }),
    updateLocation: builder.mutation<Location, { id: string; body: Partial<Omit<CreateLocationDto, 'buildingId'>> }>({
      query: ({ id, body }) => ({ url: `/locations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Locations'],
    }),
    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({ url: `/locations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Locations'],
    }),
    activateLocation: builder.mutation<Location, string>({
      query: (id) => ({ url: `/locations/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['Locations'],
    }),
    deactivateLocation: builder.mutation<Location, string>({
      query: (id) => ({ url: `/locations/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['Locations'],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useActivateLocationMutation,
  useDeactivateLocationMutation,
} = locationsApi;
