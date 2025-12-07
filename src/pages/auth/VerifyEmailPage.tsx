import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import { Button, Stack, Typography, Link as MuiLink } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

type Status = 'loading' | 'success' | 'error';

export const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
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
    <AuthLayout title="Email Doğrulama" subtitle="">
      <Stack spacing={3} alignItems="center" textAlign="center">
        {status === 'success' ? (
          <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
        ) : status === 'error' ? (
          <ErrorIcon color="error" sx={{ fontSize: 48 }} />
        ) : null}
        <Typography variant="h6">{message}</Typography>
        {status === 'success' && (
          <Button variant="contained" onClick={() => navigate('/login', { replace: true })}>
            Giriş Yap
          </Button>
        )}
        {status === 'error' && (
          <Typography>
            Token süresi dolduysa{' '}
            <MuiLink component={Link} to="/register" underline="hover">
              tekrar kayıt olmayı
            </MuiLink>{' '}
            deneyin.
          </Typography>
        )}
      </Stack>
    </AuthLayout>
  );
};

