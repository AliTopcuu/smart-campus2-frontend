import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  DashboardPage,
  ForgotPasswordPage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from '@/pages';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { PublicRoute } from '@/components/routing/PublicRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password/:token',
    element: (
      <PublicRoute>
        <ResetPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: '/verify-email/:token',
    element: (
      <PublicRoute>
        <VerifyEmailPage />
      </PublicRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

