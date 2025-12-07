import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { resetPasswordSchema } from '@/utils/validationSchemas';
import type { ResetPasswordPayload } from '@/types/auth';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';
import { Button, Stack, TextField, Typography, Link as MuiLink } from '@mui/material';

type ResetFormValues = Omit<ResetPasswordPayload, 'token'>;

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetFormValues) => {
    if (!token) {
      toast.error('Geçersiz veya eksik token');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.resetPassword({ ...values, token });
      toast.success(response.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
      setIsSuccess(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Yeni Şifre Belirle" subtitle="Güçlü bir şifre seçin">
      <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Yeni Şifre"
              type="password"
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              disabled={isSuccess}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Yeni Şifre (Tekrar)"
              type="password"
              fullWidth
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              disabled={isSuccess}
            />
          )}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting || isSuccess}>
          {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </Button>

        <Typography textAlign="center" color="text.secondary">
          Yeni şifre ile giriş yapmak için{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            buraya tıklayın
          </MuiLink>
        </Typography>
      </Stack>
    </AuthLayout>
  );
};

