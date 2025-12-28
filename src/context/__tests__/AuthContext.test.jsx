import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { tokenStorage } from '@/utils/tokenStorage';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock services
vi.mock('@/services/authService');
vi.mock('@/services/userService');
vi.mock('@/utils/tokenStorage');

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        removeQueries: vi.fn(),
    }),
}));

const TestComponent = () => {
    const { user, isAuthenticated, login, logout, isInitializing } = useAuth();
    if (isInitializing) return <div>Loading...</div>;
    return (
        <div>
            <div data-testid="auth-state">{isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
            {user && <div data-testid="user-name">{user.fullName}</div>}
            <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with no user if token is missing', async () => {
        tokenStorage.getAccessToken.mockReturnValue(null);
        tokenStorage.getUser.mockReturnValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Initial loading state might be brief or nonexistent depending on logic
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('auth-state')).toHaveTextContent('Unauthenticated');
    });

    it('should initialize with user if token exists and profile fetch succeeds', async () => {
        tokenStorage.getAccessToken.mockReturnValue('valid-token');
        tokenStorage.getUser.mockReturnValue({ fullName: 'Cached User' });
        tokenStorage.isRememberMe.mockReturnValue(false);

        const mockUser = { id: 1, fullName: 'Test User', role: 'student' };
        userService.getProfile.mockResolvedValue(mockUser);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        // Initially might show cached user or loading
        await waitFor(() => {
            expect(userService.getProfile).toHaveBeenCalled();
            expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        });
    });

    it('should handle login successfully', async () => {
        tokenStorage.getAccessToken.mockReturnValue(null);
        tokenStorage.getUser.mockReturnValue(null);

        authService.login.mockResolvedValue({
            user: { id: 1, fullName: 'Logged In User' },
            tokens: { accessToken: 'abc', refreshToken: 'def' }
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Click login
        const loginBtn = screen.getByText('Login');

        await act(async () => {
            loginBtn.click();
        });

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
            expect(screen.getByTestId('user-name')).toHaveTextContent('Logged In User');
        });
    });

    it('should handle logout', async () => {
        // Setup logged in state
        tokenStorage.getAccessToken.mockReturnValue('valid-token');
        const mockUser = { id: 1, fullName: 'Test User' };
        userService.getProfile.mockResolvedValue(mockUser);
        authService.logout.mockResolvedValue({});

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
        });

        const logoutBtn = screen.getByText('Logout');

        await act(async () => {
            logoutBtn.click();
        });

        await waitFor(() => {
            expect(authService.logout).toHaveBeenCalled();
            expect(screen.getByTestId('auth-state')).toHaveTextContent('Unauthenticated');
            expect(tokenStorage.clear).toHaveBeenCalled();
        });
    });
});
