import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { PublicLayout, AdminLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { RequirePermission } from './RequirePermission';
import { NotFoundPage } from './NotFoundPage';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('@/modules/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@/modules/roles/pages/RolesPage'));
const BuildingsPage = lazy(() => import('@/modules/buildings/pages/BuildingsPage'));
const ChecklistTemplatesPage = lazy(() => import('@/modules/checklists/pages/ChecklistTemplatesPage'));
const TemplateBuilderPage = lazy(() => import('@/modules/checklists/pages/TemplateBuilderPage'));
const ChecklistInstancesPage = lazy(() => import('@/modules/checklists/pages/ChecklistInstancesPage'));
const MyChecklistsPage = lazy(() => import('@/modules/checklists/pages/MyChecklistsPage'));
const ChecklistFillPage = lazy(() => import('@/modules/checklists/pages/ChecklistFillPage'));
const MatrixFillPage = lazy(() => import('@/modules/checklists/pages/MatrixFillPage'));
const InspectionAssignmentsPage = lazy(() => import('@/modules/checklists/pages/InspectionAssignmentsPage'));
const AssignInspectionPage = lazy(() => import('@/modules/checklists/pages/AssignInspectionPage'));

const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }} />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { path: 'login', element: <LazyLoad><LoginPage /></LazyLoad> },
      { index: true, element: <Navigate to="/dashboard" replace /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <RequirePermission permission="dashboard.view"><LazyLoad><DashboardPage /></LazyLoad></RequirePermission> },
      { path: 'roles', element: <RequirePermission permission="role.view"><LazyLoad><RolesPage /></LazyLoad></RequirePermission> },
      { path: 'users', element: <RequirePermission permission="user.view"><LazyLoad><UsersPage /></LazyLoad></RequirePermission> },
      { path: 'buildings', element: <RequirePermission permission="building.view"><LazyLoad><BuildingsPage /></LazyLoad></RequirePermission> },
      { path: 'checklist-templates', element: <RequirePermission permission="checklist-template.view"><LazyLoad><ChecklistTemplatesPage /></LazyLoad></RequirePermission> },
      { path: 'checklist-templates/:id', element: <RequirePermission permission="checklist-template.update"><LazyLoad><TemplateBuilderPage /></LazyLoad></RequirePermission> },
      { path: 'checklist-instances', element: <RequirePermission anyOf={['checklist-instance.view-all', 'checklist-instance.view-approver']}><LazyLoad><ChecklistInstancesPage /></LazyLoad></RequirePermission> },
      { path: 'inspection-assignments', element: <RequirePermission permission="checklist-template.view"><LazyLoad><InspectionAssignmentsPage /></LazyLoad></RequirePermission> },
      { path: 'inspection-assignments/new', element: <RequirePermission permission="checklist-template.assign"><LazyLoad><AssignInspectionPage /></LazyLoad></RequirePermission> },
      { path: 'inspection-assignments/:id', element: <RequirePermission permission="checklist-template.assign"><LazyLoad><AssignInspectionPage /></LazyLoad></RequirePermission> },
      { path: 'my-checklists', element: <RequirePermission permission="checklist-instance.submit"><LazyLoad><MyChecklistsPage /></LazyLoad></RequirePermission> },
      { path: 'my-checklists/:id/fill', element: <RequirePermission permission="checklist-instance.submit"><LazyLoad><ChecklistFillPage /></LazyLoad></RequirePermission> },
      { path: 'my-checklists/:id/matrix', element: <RequirePermission permission="checklist-instance.submit"><LazyLoad><MatrixFillPage /></LazyLoad></RequirePermission> },
      { path: 'my-checklists/:id/view', element: <RequirePermission permission="checklist-instance.submit"><LazyLoad><ChecklistFillPage /></LazyLoad></RequirePermission> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
