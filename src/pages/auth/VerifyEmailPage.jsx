import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Email doğrulanıyor...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Doğrulama tokenı bulunamadı.');
        return;
      }

      try {
        const response = await authService.verifyEmail({ token });
        setStatus('success');
        setMessage(response.message ?? 'Email adresiniz doğrulandı.');
      } catch (error) {
        setStatus('error');
        setMessage(getApiErrorMessage(error, 'Email doğrulanamadı.'));
      }
    };
    verify();
  }, [token]);

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
          <Stack spacing={4} alignItems="center" textAlign="center">
            {/* Header Section */}
            <Box>
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
                Email Doğrulama
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'rgba(226, 232, 240, 0.9)',
                }}
              >
                Hesabınızı aktifleştiriyoruz
              </Typography>
            </Box>

            {/* Status Section */}
            <Box sx={{ py: 2 }}>
              {status === 'loading' && (
                <CircularProgress
                  size={64}
                  sx={{
                    color: '#3b82f6',
                  }}
                />
              )}
              {status === 'success' && (
                <CheckCircleIcon
                  sx={{
                    fontSize: 80,
                    color: '#10b981',
                  }}
                />
              )}
              {status === 'error' && (
                <ErrorIcon
                  sx={{
                    fontSize: 80,
                    color: '#ef4444',
                  }}
                />
              )}
            </Box>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(226, 232, 240, 0.9)',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {message}
            </Typography>

            {status === 'success' && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate('/login', { replace: true })}
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
                }}
              >
                Giriş Yap
              </Button>
            )}

            {status === 'error' && (
              <Stack spacing={2} alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(226, 232, 240, 0.9)',
                    maxWidth: '400px',
                  }}
                >
                  Token süresi dolduysa veya geçersizse, lütfen tekrar kayıt olmayı deneyin.
                </Typography>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  size="medium"
                  sx={{
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                    color: '#f1f5f9',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                >
                  Tekrar Kayıt Ol
                </Button>
                <MuiLink
                  component={Link}
                  to="/login"
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
                  Giriş sayfasına dön
                </MuiLink>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
