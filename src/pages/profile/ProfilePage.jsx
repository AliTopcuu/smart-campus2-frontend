import { useEffect, useRef, useState, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useAuth } from '@/context/AuthContext';
import { profileSchema, changePasswordSchema } from '@/utils/validationSchemas';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/utils/apiError';
import { API_BASE_URL } from '@/utils/constant';

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
    },
  });

  useEffect(() => {
    reset({
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
    });
  }, [user, reset]);

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values) => {
    try {
      await userService.updateProfile(values);
      toast.success('Profiliniz güncellendi');
      await refreshProfile();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await userService.changePassword(values);
      toast.success('Şifreniz güncellendi');
      resetPasswordForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await userService.uploadProfilePicture(file);
      toast.success('Profil fotoğrafınız güncellendi');
      await refreshProfile();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  // Resim URL'ini oluşturma mantığı - avatarUrl veya profilePictureUrl kontrolü
  const avatarSource = useMemo(() => {
    const avatarUrl = user?.avatarUrl || user?.profilePictureUrl;
    if (!avatarUrl) return undefined;
    
    // Eğer URL zaten tam URL ise (http:// veya https:// ile başlıyorsa) direkt kullan
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      // Cache'i bypass etmek için timestamp ekle (sadece avatarUrl değiştiğinde güncellenir)
      return `${avatarUrl}?t=${Date.now()}`;
    }
    
    // Relative URL ise API_BASE_URL ekle
    return `${API_BASE_URL}${avatarUrl}?t=${Date.now()}`;
  }, [user?.avatarUrl, user?.profilePictureUrl]);

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" spacing={2}>
                <Avatar
                  key={user?.avatarUrl || user?.profilePictureUrl || 'default'}
                  src={avatarSource}
                  sx={{ width: 120, height: 120 }}
                >
                  {user?.fullName?.[0]}
                </Avatar>
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Yükleniyor...' : 'Fotoğrafı Güncelle'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarUpload}
                />
                <Typography color="text.secondary">
                  JPG/PNG • Max 5MB
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Kişisel Bilgiler
              </Typography>
              <Stack
                component="form"
                spacing={2}
                onSubmit={handleSubmit(onProfileSubmit)}
                noValidate
              >
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
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telefon"
                      fullWidth
                      error={Boolean(errors.phone)}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bölüm"
                      fullWidth
                      error={Boolean(errors.department)}
                      helperText={errors.department?.message}
                    />
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Bilgileri Güncelle'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Şifre Güncelle
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Güvenliğiniz için güçlü ve benzersiz bir şifre kullanın.
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Stack
            component="form"
            spacing={2}
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            noValidate
          >
            <Controller
              name="currentPassword"
              control={passwordControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mevcut Şifre"
                  type="password"
                  fullWidth
                  error={Boolean(passwordErrors.currentPassword)}
                  helperText={passwordErrors.currentPassword?.message}
                />
              )}
            />
            <Controller
              name="newPassword"
              control={passwordControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Yeni Şifre"
                  type="password"
                  fullWidth
                  error={Boolean(passwordErrors.newPassword)}
                  helperText={passwordErrors.newPassword?.message}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={passwordControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Yeni Şifre (Tekrar)"
                  type="password"
                  fullWidth
                  error={Boolean(passwordErrors.confirmPassword)}
                  helperText={passwordErrors.confirmPassword?.message}
                />
              )}
            />
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={isPasswordSubmitting}
              >
                {isPasswordSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

