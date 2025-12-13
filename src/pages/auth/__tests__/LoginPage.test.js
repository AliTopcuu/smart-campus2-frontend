import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { renderWithRouter } from '@/tests/testUtils';
const mockLogin = vi.fn();
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
};
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        isAuthenticated: false,
        isInitializing: false,
    }),
}));
vi.mock('@/hooks/useToast', () => ({
    useToast: () => mockToast,
}));
describe('LoginPage', () => {
    beforeEach(() => {
        mockLogin.mockReset();
        mockToast.success.mockReset();
        mockToast.error.mockReset();
    });
    it('shows validation errors when required fields are missing', async () => {
        renderWithRouter(_jsx(LoginPage, {}));
        fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));
        await screen.findByText(/Email zorunludur/i);
        await screen.findByText(/Şifre zorunludur/i);
        expect(mockLogin).not.toHaveBeenCalled();
    });
    it('submits form with valid credentials', async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        renderWithRouter(_jsx(LoginPage, {}));
        fireEvent.change(screen.getByLabelText(/E-posta/i), { target: { value: 'student@example.com' } });
        fireEvent.change(screen.getByLabelText(/Şifre/i), { target: { value: 'Password1' } });
        fireEvent.click(screen.getByRole('button', { name: /Giriş Yap/i }));
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'student@example.com',
                password: 'Password1',
                rememberMe: false,
            });
        });
    });
});
