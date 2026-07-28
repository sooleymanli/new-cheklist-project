import { baseApi } from '@/store/api';

export interface ChecklistInstance {
  id: string;
  templateId: string;
  scheduleId?: string;
  assignmentId?: string;
  locationId?: string;
  assignedUserId?: string;
  assignedUser?: { id: string; firstName: string; lastName: string };
  status: string;
  dueAt?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  currentApprovalStep?: number;
  createdAt: string;
  canSubmit?: boolean;
  template?: { id: string; name: string; description?: string };
  location?: { id: string; name: string; building?: { id: string; name: string } };
  assignment?: { id: string; recurrenceType: string; name?: string; description?: string };
  assignment?: {
    id: string;
    requiresApproval: boolean;
    approvalSteps: { stepOrder: number; approverId: string; approverName?: string }[];
  };
}

export interface InstanceHistoryEntry {
  id: string;
  instanceId: string;
  action: 'created' | 'started' | 'submitted' | 'approved' | 'rejected' | 'reassigned' | 'overdue';
  performedBy?: { id: string; firstName: string; lastName: string };
  comment?: string;
  createdAt: string;
}

export interface ChecklistInstanceDetail extends ChecklistInstance {
  template: {
    id: string;
    name: string;
    fields: { id: string; orderNo: number; fieldKey: string; fieldLabel: string; fieldType: string; fieldConfig: any; category?: string }[];
    locations?: { templateId: string; locationId: string; location: { id: string; name: string; building?: { id: string; name: string }; floor?: { id: string; name: string } } }[];
  };
  location?: { id: string; name: string; building?: { id: string; name: string }; floor?: { id: string; name: string } };
  responses: { id: string; fieldId: string; locationId?: string; value: any; notes?: string; location?: { id: string; name: string } }[];
}

interface InstancesResponse {
  data: ChecklistInstance[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface InstanceQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  templateId?: string;
  locationId?: string;
  assignedUserId?: string;
  frequency?: string;
}

interface SubmitResponseDto {
  fieldId: string;
  locationId?: string;
  value?: any;
  notes?: string;
}

export const checklistInstancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChecklistInstances: builder.query<InstancesResponse, InstanceQuery>({
      query: (params) => ({ url: '/checklist-instances', params }),
      transformResponse: (response: { data: ChecklistInstance[]; meta: InstancesResponse['meta'] }) => response,
      providesTags: ['ChecklistInstances'],
    }),
    getMyChecklistInstances: builder.query<InstancesResponse, InstanceQuery>({
      query: (params) => ({ url: '/checklist-instances/my', params }),
      transformResponse: (response: { data: ChecklistInstance[]; meta: InstancesResponse['meta'] }) => response,
      providesTags: ['ChecklistInstances'],
    }),
    getChecklistInstance: builder.query<ChecklistInstanceDetail, string>({
      query: (id) => `/checklist-instances/${id}`,
      transformResponse: (response: { data: ChecklistInstanceDetail }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'ChecklistInstances', id }],
    }),
    startChecklistInstance: builder.mutation<void, string>({
      query: (id) => ({ url: `/checklist-instances/${id}/start`, method: 'POST' }),
      invalidatesTags: ['ChecklistInstances'],
    }),
    submitChecklistInstance: builder.mutation<void, { id: string; responses?: SubmitResponseDto[] }>({
      query: ({ id, responses }) => ({ url: `/checklist-instances/${id}/submit`, method: 'POST', body: { responses } }),
      invalidatesTags: ['ChecklistInstances'],
    }),
    saveChecklistInstanceDraft: builder.mutation<void, { id: string; responses: SubmitResponseDto[] }>({
      query: ({ id, responses }) => ({ url: `/checklist-instances/${id}/save`, method: 'POST', body: { responses } }),
      invalidatesTags: ['ChecklistInstances'],
    }),
    approveChecklistInstance: builder.mutation<void, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/checklist-instances/${id}/approve`, method: 'POST', body: { comment } }),
      invalidatesTags: ['ChecklistInstances'],
    }),
    rejectChecklistInstance: builder.mutation<void, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/checklist-instances/${id}/reject`, method: 'POST', body: { comment } }),
      invalidatesTags: ['ChecklistInstances'],
    }),
    getInstanceHistory: builder.query<InstanceHistoryEntry[], string>({
      query: (id) => `/checklist-instances/${id}/history`,
      transformResponse: (response: { data: InstanceHistoryEntry[] }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'ChecklistInstances', id }],
    }),
  }),
});

export const {
  useGetChecklistInstancesQuery,
  useGetMyChecklistInstancesQuery,
  useGetChecklistInstanceQuery,
  useStartChecklistInstanceMutation,
  useSubmitChecklistInstanceMutation,
  useSaveChecklistInstanceDraftMutation,
  useApproveChecklistInstanceMutation,
  useRejectChecklistInstanceMutation,
  useGetInstanceHistoryQuery,
} = checklistInstancesApi;
