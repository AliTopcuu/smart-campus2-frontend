import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  Container,
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
  Paper,
  Divider,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '@/utils/validationSchemas';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';
import { appConfig } from '@/config/appConfig';
import { departmentOptions } from '@/constants/departments';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
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

  const onSubmit = async (values) => {
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

  const commonTextFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: 'rgba(51, 65, 85, 0.6)',
      color: '#f1f5f9',
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 2,
      },
      '&:hover': {
        backgroundColor: 'rgba(51, 65, 85, 0.8)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
        '& fieldset': {
          borderColor: 'rgba(59, 130, 246, 0.5)',
        },
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(51, 65, 85, 0.8)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        '& fieldset': {
          borderColor: '#3b82f6',
          borderWidth: 2,
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(226, 232, 240, 0.8)',
      fontWeight: 500,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#60a5fa',
    },
    '& .MuiFormHelperText-root': {
      color: 'rgba(226, 232, 240, 0.7)',
    },
  };

  const commonSelectStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: 'rgba(51, 65, 85, 0.6)',
      color: '#f1f5f9',
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 2,
      },
      '&:hover': {
        backgroundColor: 'rgba(51, 65, 85, 0.8)',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
        '& fieldset': {
          borderColor: 'rgba(59, 130, 246, 0.5)',
        },
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(51, 65, 85, 0.8)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        '& fieldset': {
          borderColor: '#3b82f6',
          borderWidth: 2,
        },
      },
    },
    '& .MuiSelect-select': {
      backgroundColor: 'transparent !important',
      color: '#f1f5f9',
    },
    '& .MuiSelect-icon': {
      color: 'rgba(226, 232, 240, 0.7)',
      transition: 'color 0.2s ease',
    },
    '&:hover .MuiSelect-icon': {
      color: '#60a5fa',
    },
    '&.Mui-focused .MuiSelect-icon': {
      color: '#60a5fa',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        overflow: 'hidden',
      }}
    >
      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 6,
            p: { xs: 3, sm: 5 },
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          <Stack spacing={4}>
            {/* Header Section */}
            <Box textAlign="center">
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #059669 50%, #1e40af 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '2rem', sm: '2.5rem' },
                }}
              >
                Hesap Oluştur
              </Typography>
              <Typography
                variant="body1"
                sx={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 500,
                  color: 'rgba(226, 232, 240, 0.9)',
                }}
              >
                {appConfig.appName} ailesine katılın
              </Typography>
            </Box>

            {/* Form Section */}
            <Stack component="form" spacing={3} onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
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
                      sx={commonTextFieldStyles}
                    />
                  )}
                />
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
                      sx={commonTextFieldStyles}
                    />
                  )}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
                        sx={commonTextFieldStyles}
                      />
                    )}
                  />
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
                        sx={commonTextFieldStyles}
                      />
                    )}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth error={Boolean(errors.role)}>
                    <InputLabel id="role-label" sx={{ color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                      Kullanıcı Tipi
                    </InputLabel>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="role-label"
                          id="role"
                          label="Kullanıcı Tipi"
                          sx={commonSelectStyles}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: 'rgba(30, 41, 59, 0.98)',
                                color: '#f1f5f9',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                '& .MuiMenuItem-root': {
                                  color: '#f1f5f9',
                                  '&:hover': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(59, 130, 246, 0.4)',
                                    },
                                  },
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="student">Öğrenci</MenuItem>
                          <MenuItem value="faculty">Akademisyen</MenuItem>
                        </Select>
                      )}
                    />
                    <FormHelperText sx={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                      {errors.role?.message}
                    </FormHelperText>
                  </FormControl>
                  <FormControl fullWidth error={Boolean(errors.department)}>
                    <InputLabel id="department-label" sx={{ color: 'rgba(226, 232, 240, 0.8)', fontWeight: 500 }}>
                      Bölüm
                    </InputLabel>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          labelId="department-label"
                          id="department"
                          label="Bölüm"
                          sx={commonSelectStyles}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                backgroundColor: 'rgba(30, 41, 59, 0.98)',
                                color: '#f1f5f9',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                '& .MuiMenuItem-root': {
                                  color: '#f1f5f9',
                                  '&:hover': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(59, 130, 246, 0.4)',
                                    },
                                  },
                                },
                              },
                            },
                          }}
                        >
                          {departmentOptions.map((department) => (
                            <MenuItem key={department.value} value={department.value}>
                              {department.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    <FormHelperText sx={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                      {errors.department?.message}
                    </FormHelperText>
                  </FormControl>
                </Stack>
                {role === 'student' && (
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
                        sx={commonTextFieldStyles}
                      />
                    )}
                  />
                )}
              </Stack>

              <Controller
                name="termsAccepted"
                control={control}
                render={({ field }) => (
                  <FormControl error={Boolean(errors.termsAccepted)}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          sx={{
                            color: '#1e40af',
                            '&.Mui-checked': {
                              color: '#059669',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography 
                          component="span"
                          sx={{
                            color: 'rgba(226, 232, 240, 0.9)',
                          }}
                        >
                          Kullanım şartlarını okudum ve kabul ediyorum.
                        </Typography>
                      }
                    />
                    <FormHelperText sx={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                      {errors.termsAccepted?.message}
                    </FormHelperText>
                  </FormControl>
                )}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #059669 50%, #1e40af 100%)',
                  borderRadius: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(30, 58, 138, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #047857 50%, #1e3a8a 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #059669 50%, #1e40af 100%)',
                    opacity: 0.7,
                  },
                }}
              >
                {isSubmitting ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
              </Button>
            </Stack>

            <Divider sx={{ my: 1, borderColor: 'rgba(148, 163, 184, 0.3)' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  px: 2,
                  color: 'rgba(226, 232, 240, 0.7)',
                }}
              >
                veya
              </Typography>
            </Divider>

            <Typography 
              textAlign="center" 
              sx={{ 
                fontSize: '0.95rem',
                color: 'rgba(226, 232, 240, 0.9)',
              }}
            >
              Zaten hesabınız var mı?{' '}
              <MuiLink
                component={Link}
                to="/login"
                underline="hover"
                sx={{
                  color: '#60a5fa',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#34d399',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                Giriş Yap
              </MuiLink>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
