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
  StudentManagementPage,
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
  MealManagementPage,
  MealReservationPage,
  MealScannerPage,
  WalletPage,
  PaymentMockPage,
  EventListPage,
  EventDetailPage,
  MyTicketsPage,
  EventCheckInPage,
  EventManagementPage,
  ClassroomReservationPage,
  MySchedulePage,
  GenerateSchedulePage,
  ClassroomManagementPage,
  ReservationApprovalPage
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
      {
        path: '/admin/students',
        element: <ProtectedRoute roles={['admin']}><StudentManagementPage /></ProtectedRoute>,
      },
      {
        path: '/admin/meals',
        element: <ProtectedRoute roles={['admin']}><MealManagementPage /></ProtectedRoute>,
      },
      {
        path: '/admin/meals/scan',
        element: <ProtectedRoute roles={['admin', 'cafeteria_staff']}><MealScannerPage /></ProtectedRoute>,
      },
      {
        path: '/meals',
        element: <ProtectedRoute roles={['student', 'faculty', 'admin']}><MealReservationPage /></ProtectedRoute>,
      },
      {
        path: '/wallet',
        element: <ProtectedRoute roles={['student', 'faculty']}><WalletPage /></ProtectedRoute>,
      },
      {
        path: '/payment-mock',
        element: <ProtectedRoute roles={['student', 'faculty']}><PaymentMockPage /></ProtectedRoute>,
      },
      {
        path: '/events',
        element: <EventListPage />,
      },
      {
        path: '/events/:id',
        element: <EventDetailPage />,
      },
      {
        path: '/my-tickets',
        element: <ProtectedRoute roles={['student', 'faculty']}><MyTicketsPage /></ProtectedRoute>,
      },
      {
        path: '/admin/events/check-in',
        element: <ProtectedRoute roles={['admin']}><EventCheckInPage /></ProtectedRoute>,
      },
      {
        path: '/admin/events',
        element: <ProtectedRoute roles={['admin']}><EventManagementPage /></ProtectedRoute>,
      },
      {
        path: '/reservations',
        element: <ClassroomReservationPage />,
      },
      {
        path: '/schedule',
        element: <MySchedulePage />,
      },
      {
        path: '/admin/scheduling/generate',
        element: <ProtectedRoute roles={['admin']}><GenerateSchedulePage /></ProtectedRoute>,
      },
      {
        path: '/admin/classrooms',
        element: <ProtectedRoute roles={['admin']}><ClassroomManagementPage /></ProtectedRoute>,
      },
      {
        path: '/admin/reservations',
        element: <ProtectedRoute roles={['admin']}><ReservationApprovalPage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

