export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: string;
  studentNumber?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | 'student' | 'faculty';
  studentNumber?: string;
  department?: string;
  termsAccepted: boolean;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  department?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

