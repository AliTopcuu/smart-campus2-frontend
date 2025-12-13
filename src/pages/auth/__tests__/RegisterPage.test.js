import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { RegisterPage } from '../RegisterPage';
import { renderWithRouter } from '@/tests/testUtils';
const mockRegister = vi.fn();
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
};
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
        isAuthenticated: false,
        isInitializing: false,
    }),
}));
vi.mock('@/hooks/useToast', () => ({
    useToast: () => mockToast,
}));
describe('RegisterPage', () => {
    beforeEach(() => {
        mockRegister.mockReset();
        mockToast.success.mockReset();
        mockToast.error.mockReset();
    });
    const fillCommonFields = () => {
        fireEvent.change(screen.getByLabelText(/Ad Soyad/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/E-posta/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/^Şifre$/i), { target: { value: 'Password1' } });
        fireEvent.change(screen.getByLabelText(/Şifre Tekrar/i), { target: { value: 'Password1' } });
        fireEvent.mouseDown(screen.getByLabelText(/Kullanıcı Tipi/i));
        fireEvent.click(screen.getByRole('option', { name: /Öğrenci/i }));
        fireEvent.mouseDown(screen.getByLabelText(/Bölüm/i));
        fireEvent.click(screen.getByRole('option', { name: /Bilgisayar Mühendisliği/i }));
        fireEvent.change(screen.getByLabelText(/Öğrenci Numarası/i), { target: { value: '123456' } });
        fireEvent.click(screen.getByText(/kabul ediyorum/i));
    };
    it('validates required fields', async () => {
        renderWithRouter(_jsx(RegisterPage, {}));
        fireEvent.click(screen.getByRole('button', { name: /Hesap Oluştur/i }));
        await screen.findAllByText(/zorunlu/i);
        expect(mockRegister).not.toHaveBeenCalled();
    });
    it('submits form with valid data', async () => {
        mockRegister.mockResolvedValueOnce('Başarılı');
        renderWithRouter(_jsx(RegisterPage, {}));
        fillCommonFields();
        fireEvent.click(screen.getByRole('button', { name: /Hesap Oluştur/i }));
        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
        });
    });
});
