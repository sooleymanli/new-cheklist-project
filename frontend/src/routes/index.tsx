import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { PublicLayout, AdminLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { NotFoundPage } from './NotFoundPage';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('@/modules/users/pages/UsersPage'));
const RolesPage = lazy(() => import('@/modules/roles/pages/RolesPage'));
const BuildingsPage = lazy(() => import('@/modules/buildings/pages/BuildingsPage'));

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
      { path: 'dashboard', element: <LazyLoad><DashboardPage /></LazyLoad> },
      { path: 'roles', element: <LazyLoad><RolesPage /></LazyLoad> },
      { path: 'users', element: <LazyLoad><UsersPage /></LazyLoad> },
      { path: 'buildings', element: <LazyLoad><BuildingsPage /></LazyLoad> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
