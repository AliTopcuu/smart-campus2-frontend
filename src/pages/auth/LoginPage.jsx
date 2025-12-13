import { useState, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/utils/validationSchemas';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';
import { appConfig } from '@/config/appConfig';

export const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Parallax efekti için mouse hareketini dinle
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 100;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 100;
        setMousePosition({ x, y });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe || false,
      });
      toast.success('Hoş geldiniz!');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
      }}
    >
      {/* Parallax arka plan - Logo resmi */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/university-logo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
          transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
          transition: 'transform 0.1s ease-out',
          zIndex: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(30, 41, 59, 0.85) 100%)',
          },
        }}
      />
      
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
                Hoş Geldiniz
              </Typography>
              <Typography
                variant="body1"
                sx={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 500,
                  color: 'rgba(226, 232, 240, 0.9)',
                }}
              >
                {appConfig.appName} hesabınıza giriş yapın
              </Typography>
            </Box>

            {/* Form Section */}
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
                    sx={{
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
                    }}
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
                    sx={{
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
                    }}
                  />
                )}
              />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
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
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: 'rgba(226, 232, 240, 0.9)',
                          }}
                        >
                          Beni hatırla
                        </Typography>
                      }
                    />
                  )}
                />
                <MuiLink
                  component={Link}
                  to="/forgot-password"
                  underline="hover"
                  sx={{
                    color: '#60a5fa',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#34d399',
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  Şifremi Unuttum?
                </MuiLink>
              </Box>

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
                {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
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
              Hesabınız yok mu?{' '}
              <MuiLink
                component={Link}
                to="/register"
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
                Hemen kayıt olun
              </MuiLink>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
