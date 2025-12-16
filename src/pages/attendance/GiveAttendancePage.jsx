import { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { calculateDistance, formatDistance } from '@/utils/distanceCalculator';
import { attendanceService } from '@/services/attendanceService';

export const GiveAttendancePage = () => {
  const { sessionId } = useParams();
  const toast = useToast();
  const [sessionData, setSessionData] = useState(null);
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, ready, success, error
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoadingSession(true);
      const data = await attendanceService.getSessionById(sessionId);
      setSessionData(data);
    } catch (error) {
      toast.error(error.message || 'Yoklama oturumu yüklenemedi');
      setStatus('error');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Mesafe hesaplama
  const distance = useMemo(() => {
    if (!location || !sessionData?.location) return null;
    return calculateDistance(
      location.lat,
      location.lon,
      sessionData.location.lat,
      sessionData.location.lng
    );
  }, [location, sessionData]);

  // Geofence içinde mi kontrolü
  const isWithinGeofence = useMemo(() => {
    if (distance === null || distance === undefined || !sessionData) return false;
    return distance <= sessionData.geofenceRadius;
  }, [distance, sessionData]);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }

    setStatus('loading');
    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const userLat = result.coords.latitude;
        const userLon = result.coords.longitude;
        const userAccuracy = result.coords.accuracy;

        setLocation({ lat: userLat, lon: userLon, lng: userLon }); // Store both lon and lng for compatibility
        setAccuracy(userAccuracy);
        setStatus('ready');
        setIsGettingLocation(false);

        // Accuracy uyarısı (bilgisayarlarda genellikle düşük accuracy)
        if (userAccuracy > 1000) {
          toast.warning(
            `Konum alındı ancak doğruluk düşük (±${Math.round(userAccuracy)}m). Bilgisayarlarda GPS olmadığı için konum WiFi/IP tabanlıdır ve yanlış olabilir. Telefondan test etmeniz önerilir.`
          );
        }

        // Mesafe kontrolü
        if (sessionData) {
          const calculatedDistance = calculateDistance(
            userLat,
            userLon,
            sessionData.location.lat,
            sessionData.location.lng
          );

          if (calculatedDistance > sessionData.geofenceRadius) {
            toast.warning(
              `Kampüse uzaklığınız: ${formatDistance(calculatedDistance)}. Geofence yarıçapı: ${sessionData.geofenceRadius}m`
            );
          } else {
            toast.success(`Konum başarıyla alındı ve kampüs bölgesi içindesiniz. Mesafe: ${formatDistance(calculatedDistance)}`);
          }
        }
      },
      (error) => {
        setIsGettingLocation(false);
        setStatus('error');
        let errorMessage = 'Konum alınamadı.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi alınamıyor.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum alma işlemi zaman aşımına uğradı.';
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async () => {
    if (!location) {
      toast.error('Önce konumunuzu alın.');
      return;
    }

    if (!isWithinGeofence) {
      toast.warning(
        `Sınıf bölgesinin dışındasınız. Mesafe: ${formatDistance(distance)}. Yoklamaya katılamazsınız.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.checkIn(sessionId, {
        lat: location.lat,
        lng: location.lon || location.lng // Support both lon and lng
      });
      setStatus('success');
      toast.success('Yoklama başarıyla kaydedildi!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Yoklamaya katılırken bir hata oluştu');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitByCode = async () => {
    if (!location) {
      toast.error('Önce konumunuzu alın.');
      return;
    }

    if (!sessionData?.code) {
      toast.error('Yoklama kodu bulunamadı.');
      return;
    }

    if (!isWithinGeofence) {
      toast.warning(
        `Sınıf bölgesinin dışındasınız. Mesafe: ${formatDistance(distance)}. Yoklamaya katılamazsınız.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.checkInByCode(sessionData.code, {
        lat: location.lat,
        lng: location.lon || location.lng // Support both lon and lng
      });
      setStatus('success');
      toast.success('Yoklama başarıyla kaydedildi!');
    } catch (error) {
      console.error('Check-in by code error:', error);
      toast.error(error.message || 'Yoklamaya katılırken bir hata oluştu');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    });
  };

  if (isLoadingSession) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!sessionData) {
    return (
      <Box>
        <Alert severity="error">Yoklama oturumu bulunamadı.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklamaya Katıl
      </Typography>

      {/* Session Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SchoolIcon color="primary" />
              <Box>
                <Typography variant="h6">
                  {sessionData.sectionId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {sessionData.sectionName}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Başlangıç - Bitiş
                    </Typography>
                    <Typography variant="body2">
                      {formatTime(sessionData.startTime)} - {formatTime(sessionData.endTime)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Geofence Yarıçapı
                    </Typography>
                    <Typography variant="body2">{sessionData.geofenceRadius}m</Typography>
                  </Box>
                </Stack>
              </Grid>
              {sessionData.instructor && (
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Hoca
                      </Typography>
                      <Typography variant="body2">{sessionData.instructor.name}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              )}
            </Grid>

            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.light',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Yoklama Kodu:
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  color: 'primary.dark',
                }}
              >
                {sessionData.code}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Bu kod ile de yoklamaya katılabilirsiniz
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {isGettingLocation && (
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Konum alınıyor...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {!location && !isGettingLocation && (
              <Button
                variant="contained"
                size="large"
                startIcon={<LocationSearchingIcon />}
                onClick={getLocation}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Konumumu Al
              </Button>
            )}

            {location && (
              <>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Konum Bilgileri
                  </Typography>
                  <Alert severity="info" icon={false}>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          📍 Sınıf Konumu
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {sessionData.location.lat.toFixed(6)}, {sessionData.location.lng.toFixed(6)}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          📍 Öğrenci Konumu
                        </Typography>
                        <Typography variant="body2">
                          <strong>Koordinatlar:</strong> {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                        </Typography>
                        {accuracy && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Doğruluk:</strong> ±{Math.round(accuracy)}m
                          </Typography>
                        )}
                      </Box>

                      <Divider />

                      {distance !== null && (
                        <Box>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            📏 Mesafe Bilgisi
                          </Typography>
                          <Typography variant="body2">
                            <strong>Kampüse Mesafe:</strong> {formatDistance(distance)}
                          </Typography>
                          <Box mt={1}>
                            <Chip
                              label={isWithinGeofence ? `${sessionData.geofenceRadius}m İçinde ✓ (${Math.round(distance)}m)` : `${sessionData.geofenceRadius}m Dışında ✗ (${Math.round(distance)}m)`}
                              color={isWithinGeofence ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Alert>
                </Stack>

                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={status === 'loading' || status === 'success' || isSubmitting || !isWithinGeofence}
                    startIcon={status === 'success' ? <CheckCircleIcon /> : <CheckCircleIcon />}
                    onClick={handleSubmit}
                    fullWidth
                    sx={{ py: 1.5 }}
                    color={isWithinGeofence ? 'primary' : 'error'}
                  >
                    {isSubmitting ? 'Kaydediliyor...' : status === 'success' ? 'Yoklamaya Katıldınız ✓' : isWithinGeofence ? 'QR Kod ile Katıl' : `${sessionData.geofenceRadius}m İçinde Değilsiniz`}
                  </Button>
                  
                  {sessionData?.code && (
                    <Button
                      variant="outlined"
                      size="large"
                      disabled={status === 'loading' || status === 'success' || isSubmitting || !isWithinGeofence}
                      startIcon={<CheckCircleIcon />}
                      onClick={handleSubmitByCode}
                      fullWidth
                      sx={{ py: 1.5 }}
                      color={isWithinGeofence ? 'primary' : 'error'}
                    >
                      {isSubmitting ? 'Kaydediliyor...' : status === 'success' ? 'Yoklamaya Katıldınız ✓' : isWithinGeofence ? `Kod ile Katıl (${sessionData.code})` : `${sessionData.geofenceRadius}m İçinde Değilsiniz`}
                    </Button>
                  )}
                </Stack>
                {!isWithinGeofence && distance !== null && (
                  <Alert severity="warning">
                    Sınıfa uzaklığınız {formatDistance(distance)}. Yoklamaya katılmak için {sessionData.geofenceRadius} metre içinde olmanız gerekiyor.
                  </Alert>
                )}
              </>
            )}

            {status === 'error' && (
              <Button variant="outlined" onClick={getLocation} startIcon={<LocationSearchingIcon />}>
                Tekrar Dene
              </Button>
            )}

            {status === 'success' && (
              <Alert severity="success">Yoklama başarıyla kaydedildi!</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

