import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { resetPasswordSchema } from '@/utils/validationSchemas';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';
import { appConfig } from '@/config/appConfig';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      toast.error('Geçersiz veya eksik token');
    }
  }, [token, toast]);

  const onSubmit = async (values) => {
    if (!token) {
      toast.error('Geçersiz veya eksik token');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authService.resetPassword({ ...values, token });
      toast.success(response.message ?? 'Şifreniz güncellendi. Giriş yapabilirsiniz.');
      setIsSuccess(true);
      
      // 2 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonBoxStyles = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4,
    overflow: 'hidden',
  };

  const commonPaperStyles = {
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

  if (tokenError) {
    return (
      <Box sx={commonBoxStyles}>
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
          <Paper elevation={0} sx={commonPaperStyles}>
            <Stack spacing={3}>
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
                  Geçersiz Link
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 500,
                    color: 'rgba(226, 232, 240, 0.9)',
                  }}
                >
                  Şifre sıfırlama linki geçersiz veya süresi dolmuş
                </Typography>
              </Box>

              <Alert 
                severity="error" 
                sx={{ 
                  borderRadius: 2,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                Bu şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun.
              </Alert>

              <Button
                component={Link}
                to="/forgot-password"
                variant="contained"
                size="large"
                fullWidth
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
                }}
              >
                Yeni Şifre Sıfırlama Talebi
              </Button>

              <Typography 
                textAlign="center" 
                sx={{ 
                  fontSize: '0.95rem',
                  color: 'rgba(226, 232, 240, 0.9)',
                }}
              >
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
                  Giriş sayfasına dön
                </MuiLink>
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={commonBoxStyles}>
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
        <Paper elevation={0} sx={commonPaperStyles}>
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
                Yeni Şifre Belirle
              </Typography>
              <Typography
                variant="body1"
                sx={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 500,
                  color: 'rgba(226, 232, 240, 0.9)',
                }}
              >
                Güçlü ve güvenli bir şifre seçin
              </Typography>
            </Box>

            {/* Form Section */}
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
                    autoComplete="new-password"
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
                    label="Yeni Şifre (Tekrar)"
                    type="password"
                    fullWidth
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    disabled={isSuccess}
                    autoComplete="new-password"
                    sx={commonTextFieldStyles}
                  />
                )}
              />

              {isSuccess && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || isSuccess}
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
                {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
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
              Yeni şifre ile giriş yapmak için{' '}
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
                buraya tıklayın
              </MuiLink>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
