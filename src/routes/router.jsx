import { createBrowserRouter, Navigate } from 'react-router-dom';
import {
  ActiveSessionsPage,
  AttendanceReportPage,
  CompletedCoursesPage,
  DashboardPage,
  CoursesPage,
  CourseDetailPage,
  CourseManagementPage,
  DepartmentManagementPage,
  ExcuseRequestsPage,
  ForgotPasswordPage,
  GiveAttendancePage,
  GradebookPage,
  GradesPage,
  LoginPage,
  MyAttendancePage,
  MyCoursesPage,
  MySectionsPage,
  NotFoundPage,
  ProfilePage,
  RegisterPage,
  ResetPasswordPage,
  ScanQRCodePage,
  SectionManagementPage,
  StartAttendancePage,
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
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/register',
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path: '/forgot-password',
    element: <PublicRoute><ForgotPasswordPage /></PublicRoute>,
  },
  {
    path: '/reset-password',
    element: <PublicRoute><ResetPasswordPage /></PublicRoute>,
  },
  {
    path: '/verify-email',
    element: <PublicRoute><VerifyEmailPage /></PublicRoute>,
  },
  {
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/courses',
        element: <CoursesPage />,
      },
      {
        path: '/courses/:id',
        element: <CourseDetailPage />,
      },
      {
        path: '/my-courses',
        element: <ProtectedRoute roles={['student']}><MyCoursesPage /></ProtectedRoute>,
      },
      {
        path: '/completed-courses',
        element: <ProtectedRoute roles={['student']}><CompletedCoursesPage /></ProtectedRoute>,
      },
      {
        path: '/grades',
        element: <ProtectedRoute roles={['student']}><GradesPage /></ProtectedRoute>,
      },
      {
        path: '/gradebook',
        element: <ProtectedRoute roles={['faculty']}><GradebookPage /></ProtectedRoute>,
      },
      {
        path: '/gradebook/:sectionId',
        element: <ProtectedRoute roles={['faculty']}><GradebookPage /></ProtectedRoute>,
      },
      {
        path: '/attendance/start',
        element: <ProtectedRoute roles={['faculty', 'admin']}><StartAttendancePage /></ProtectedRoute>,
      },
      {
        path: '/attendance/active',
        element: <ProtectedRoute roles={['student']}><ActiveSessionsPage /></ProtectedRoute>,
      },
      {
        path: '/attendance/scan',
        element: <ProtectedRoute roles={['student']}><ScanQRCodePage /></ProtectedRoute>,
      },
      {
        path: '/attendance/checkin/:sessionId',
        element: <ProtectedRoute roles={['student']}><GiveAttendancePage /></ProtectedRoute>,
      },
      {
        path: '/my-attendance',
        element: <ProtectedRoute roles={['student']}><MyAttendancePage /></ProtectedRoute>,
      },
      {
        path: '/attendance/report',
        element: <ProtectedRoute roles={['faculty', 'admin']}><AttendanceReportPage /></ProtectedRoute>,
      },
      {
        path: '/attendance/report/:sectionId',
        element: <ProtectedRoute roles={['faculty', 'admin']}><AttendanceReportPage /></ProtectedRoute>,
      },
      {
        path: '/excuse-requests',
        element: <ExcuseRequestsPage />,
      },
      {
        path: '/admin/courses',
        element: <ProtectedRoute roles={['admin']}><CourseManagementPage /></ProtectedRoute>,
      },
      {
        path: '/admin/sections',
        element: <ProtectedRoute roles={['admin']}><SectionManagementPage /></ProtectedRoute>,
      },
      {
        path: '/admin/departments',
        element: <ProtectedRoute roles={['admin']}><DepartmentManagementPage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

