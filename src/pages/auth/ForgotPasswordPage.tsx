import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack, TextField, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { forgotPasswordSchema } from '@/utils/validationSchemas';
import type { ForgotPasswordPayload } from '@/types/auth';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import { useToast } from '@/hooks/useToast';

type ForgotFormValues = ForgotPasswordPayload;

export const ForgotPasswordPage = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await authService.forgotPassword(values);
      toast.success(response.message ?? 'Şifre yenileme bağlantısı gönderildi.');
      setIsSuccess(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Şifre Sıfırlama" subtitle="E-posta adresinizi girin">
      <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="E-posta"
              type="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              disabled={isSuccess}
            />
          )}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting || isSuccess}>
          {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </Button>

        <Typography textAlign="center" color="text.secondary">
          Şifrenizi hatırladınız mı?{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            Giriş yapın
          </MuiLink>
        </Typography>
      </Stack>
    </AuthLayout>
  );
};

