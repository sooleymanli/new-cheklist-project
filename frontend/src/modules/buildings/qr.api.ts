import { baseApi } from '@/store/api';

export interface QrCode {
  id: string;
  entityType: string;
  entityId: string;
  code: string;
  isActive: boolean;
}

export const qrApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateQr: builder.mutation<QrCode, { entityType: string; entityId: string }>({
      query: (body) => ({ url: '/qr/generate', method: 'POST', body }),
      transformResponse: (response: { data: QrCode }) => response.data,
    }),
    getQrImage: builder.query<string, string>({
      query: (id) => `/qr/${id}/image`,
      transformResponse: (response: { data: string }) => response.data,
    }),
    getQrByEntity: builder.query<QrCode | null, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => `/qr/entity/${entityType}/${entityId}`,
      transformResponse: (response: { data: QrCode | null }) => response.data,
    }),
  }),
});

export const { useGenerateQrMutation, useGetQrImageQuery, useGetQrByEntityQuery } = qrApi;
