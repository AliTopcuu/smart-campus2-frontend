import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/utils/validationSchemas';
import type { LoginPayload } from '@/types/auth';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';

type LoginFormValues = LoginPayload;

export const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await login(values);
      toast.success('Hoş geldiniz!');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Giriş Yap" subtitle="Smart Campus">
      <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
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
              />
            )}
          />

        <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Şifre"
                type="password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
            )}
          />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label="Beni hatırla" />
            )}
          />
          <MuiLink component={Link} to="/forgot-password" underline="hover">
            Şifremi Unuttum?
          </MuiLink>
        </Box>

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>

        <Typography textAlign="center" color="text.secondary">
          Hesabınız yok mu?{' '}
          <MuiLink component={Link} to="/register" underline="hover">
            Hemen kayıt olun
          </MuiLink>
        </Typography>
      </Stack>
    </AuthLayout>
  );
};

