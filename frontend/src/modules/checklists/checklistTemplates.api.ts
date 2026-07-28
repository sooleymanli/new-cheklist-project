import { baseApi } from '@/store/api';

export interface FieldConfig {
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  options?: string[];
  photoRequired?: boolean;
  fileRequired?: boolean;
  helpText?: string;
  tableColumns?: any[];
  tableLocations?: any[];
}

export interface TemplateField {
  id: string;
  orderNo: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  category?: string;
  fieldConfig: FieldConfig;
}

export interface TemplateLocation {
  templateId: string;
  locationId: string;
  location: { id: string; name: string; building?: { id: string; name: string }; floor?: { id: string; name: string } };
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  fields?: TemplateField[];
  locations?: TemplateLocation[];
  _count?: { fields: number; locations: number; instances: number };
}

interface TemplatesResponse {
  data: ChecklistTemplate[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface TemplateQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

interface CreateFieldDto {
  orderNo: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  fieldConfig?: FieldConfig;
}

interface CreateTemplateDto {
  name: string;
  description?: string;
  fields?: CreateFieldDto[];
  locationIds?: string[];
}

interface UpdateTemplateDto extends Partial<CreateTemplateDto> {
  status?: string;
}

export const checklistTemplatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChecklistTemplates: builder.query<TemplatesResponse, TemplateQuery>({
      query: (params) => ({ url: '/checklist-templates', params }),
      transformResponse: (response: { data: ChecklistTemplate[]; meta: TemplatesResponse['meta'] }) => response,
      providesTags: ['ChecklistTemplates'],
    }),
    getChecklistTemplate: builder.query<ChecklistTemplate, string>({
      query: (id) => `/checklist-templates/${id}`,
      transformResponse: (response: { data: ChecklistTemplate }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'ChecklistTemplates', id }],
    }),
    createChecklistTemplate: builder.mutation<ChecklistTemplate, CreateTemplateDto>({
      query: (body) => ({ url: '/checklist-templates', method: 'POST', body }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
    updateChecklistTemplate: builder.mutation<ChecklistTemplate, { id: string; body: UpdateTemplateDto }>({
      query: ({ id, body }) => ({ url: `/checklist-templates/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
    deleteChecklistTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/checklist-templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
    activateChecklistTemplate: builder.mutation<ChecklistTemplate, string>({
      query: (id) => ({ url: `/checklist-templates/${id}/activate`, method: 'PATCH' }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
    deactivateChecklistTemplate: builder.mutation<ChecklistTemplate, string>({
      query: (id) => ({ url: `/checklist-templates/${id}/deactivate`, method: 'PATCH' }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
    duplicateChecklistTemplate: builder.mutation<ChecklistTemplate, string>({
      query: (id) => ({ url: `/checklist-templates/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: ['ChecklistTemplates'],
    }),
  }),
});

export const {
  useGetChecklistTemplatesQuery,
  useGetChecklistTemplateQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  useDeleteChecklistTemplateMutation,
  useActivateChecklistTemplateMutation,
  useDeactivateChecklistTemplateMutation,
  useDuplicateChecklistTemplateMutation,
} = checklistTemplatesApi;
