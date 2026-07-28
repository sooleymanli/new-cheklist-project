import { baseApi } from '@/store/api';

export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ApprovalStep {
  stepOrder: number;
  approverId: string;
  approverName?: string;
}

export interface InspectionAssignment {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  templateName?: string;
  assigneeIds: string[];
  assignees?: { id: string; firstName: string; lastName: string }[];
  recurrenceType: RecurrenceType;
  scheduledDate?: string;
  customIntervalHours?: number;
  customIntervalType?: 'hourly' | 'dateRange';
  customDateRangeStart?: string;
  customDateRangeEnd?: string;
  dateRangeIntervalHours?: number;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  excludeHolidayDates?: string[];
  excludeVacationDates?: string[];
  timeWindowStart: string; // HH:mm
  timeWindowEnd: string;   // HH:mm
  requiresQrStart: boolean;
  requiresApproval: boolean;
  approvalSteps: ApprovalStep[];
  isActive: boolean;
  createdAt: string;
  template?: { id: string; name: string };
}

export interface InspectionInstance {
  id: string;
  assignmentId: string;
  assigneeId: string;
  assignee?: { id: string; firstName: string; lastName: string };
  template?: { id: string; name: string };
  status: 'pending' | 'in_progress' | 'completed' | 'awaiting_approval' | 'approved' | 'rejected' | 'overdue';
  isOverdue: boolean;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  currentApprovalStep?: number;
  createdAt: string;
}

export interface ApprovalHistoryEntry {
  id: string;
  instanceId: string;
  stepOrder: number;
  approverId: string;
  approverName?: string;
  action: 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
}

interface AssignmentsResponse {
  data: InspectionAssignment[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface AssignmentQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  templateId?: string;
  isActive?: boolean;
  recurrenceType?: string;
  assigneeId?: string;
}

interface CreateAssignmentDto {
  name: string;
  description?: string;
  templateId: string;
  assigneeIds: string[];
  recurrenceType: RecurrenceType;
  scheduledDate?: string;
  customIntervalHours?: number;
  customIntervalType?: 'hourly' | 'dateRange';
  customDateRangeStart?: string;
  customDateRangeEnd?: string;
  dateRangeIntervalHours?: number;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  excludeHolidayDates?: string[];
  excludeVacationDates?: string[];
  timeWindowStart: string;
  timeWindowEnd: string;
  requiresQrStart: boolean;
  requiresApproval: boolean;
  approvalSteps: ApprovalStep[];
}

interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {
  isActive?: boolean;
}

export const inspectionAssignmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInspectionAssignments: builder.query<AssignmentsResponse, AssignmentQuery>({
      query: (params) => ({ url: '/inspection-assignments', params }),
      transformResponse: (response: { data: InspectionAssignment[]; meta: AssignmentsResponse['meta'] }) => response,
      providesTags: ['InspectionAssignments'],
    }),
    getInspectionAssignment: builder.query<InspectionAssignment, string>({
      query: (id) => `/inspection-assignments/${id}`,
      transformResponse: (response: { data: InspectionAssignment }) => response.data,
      providesTags: (_r, _e, id) => [{ type: 'InspectionAssignments', id }],
    }),
    createInspectionAssignment: builder.mutation<InspectionAssignment, CreateAssignmentDto>({
      query: (body) => ({ url: '/inspection-assignments', method: 'POST', body }),
      invalidatesTags: ['InspectionAssignments'],
    }),
    updateInspectionAssignment: builder.mutation<InspectionAssignment, { id: string; body: UpdateAssignmentDto }>({
      query: ({ id, body }) => ({ url: `/inspection-assignments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['InspectionAssignments'],
    }),
    deleteInspectionAssignment: builder.mutation<void, string>({
      query: (id) => ({ url: `/inspection-assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InspectionAssignments'],
    }),
    getApprovalHistory: builder.query<ApprovalHistoryEntry[], string>({
      query: (instanceId) => `/inspection-assignments/instances/${instanceId}/approval-history`,
      transformResponse: (response: { data: ApprovalHistoryEntry[] }) => response.data,
      providesTags: ['ApprovalHistory'],
    }),
  }),
});

export const {
  useGetInspectionAssignmentsQuery,
  useGetInspectionAssignmentQuery,
  useCreateInspectionAssignmentMutation,
  useUpdateInspectionAssignmentMutation,
  useDeleteInspectionAssignmentMutation,
  useGetApprovalHistoryQuery,
} = inspectionAssignmentsApi;
