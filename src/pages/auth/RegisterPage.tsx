import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '@/utils/validationSchemas';
import type { RegisterPayload } from '@/types/auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';

type RegisterFormValues = RegisterPayload;

const departmentOptions = [
  { value: 'computer-engineering', label: 'Bilgisayar Mühendisliği' },
  { value: 'electrical-engineering', label: 'Elektrik-Elektronik Müh.' },
  { value: 'industrial-engineering', label: 'Endüstri Müh.' },
  { value: 'business', label: 'İşletme' },
  { value: 'economics', label: 'İktisat' },
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      department: '',
      studentNumber: '',
      termsAccepted: false,
    },
  });

  const role = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      const responseMessage = await registerUser(values);
      toast.success(responseMessage ?? 'Kayıt başarılı! Lütfen emailinizi doğrulayın.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Hesap Oluştur" subtitle="Smart Campus">
      <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Ad Soyad"
                  fullWidth
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Şifre Tekrar"
                  type="password"
                  fullWidth
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={Boolean(errors.role)}>
              <InputLabel id="role-label">Kullanıcı Tipi</InputLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} labelId="role-label" id="role" label="Kullanıcı Tipi">
                    <MenuItem value="student">Öğrenci</MenuItem>
                    <MenuItem value="faculty">Akademisyen</MenuItem>
                  </Select>
                )}
              />
              <FormHelperText>{errors.role?.message}</FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={Boolean(errors.department)}>
              <InputLabel id="department-label">Bölüm</InputLabel>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="department-label"
                    id="department"
                    label="Bölüm"
                  >
                    {departmentOptions.map((department) => (
                      <MenuItem key={department.value} value={department.value}>
                        {department.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText>{errors.department?.message}</FormHelperText>
            </FormControl>
          </Grid>
          {role === 'student' && (
            <Grid size={{ xs: 12 }}>
              <Controller
                name="studentNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Öğrenci Numarası"
                    fullWidth
                    error={Boolean(errors.studentNumber)}
                    helperText={errors.studentNumber?.message}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        <Controller
          name="termsAccepted"
          control={control}
          render={({ field }) => (
            <FormControl error={Boolean(errors.termsAccepted)}>
              <FormControlLabel
                control={<Checkbox {...field} checked={field.value} />}
                label={<Typography component="span">Kullanım şartlarını okudum ve kabul ediyorum.</Typography>}
              />
              <FormHelperText>{errors.termsAccepted?.message}</FormHelperText>
            </FormControl>
          )}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
        </Button>

        <Typography textAlign="center" color="text.secondary">
          Zaten hesabınız var mı?{' '}
          <MuiLink component={Link} to="/login" underline="hover">
            Giriş Yap
          </MuiLink>
        </Typography>
      </Stack>
    </AuthLayout>
  );
};

