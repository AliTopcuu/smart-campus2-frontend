import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Fade,
  Zoom,
  Container,
  TextField,
  LinearProgress,
  Divider,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const ScanQRCodePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup: Stop scanning when component unmounts
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [html5QrCode]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      // Check if camera is available
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        throw new Error('Kamera bulunamadı. Lütfen bir kamera cihazı bağlı olduğundan emin olun.');
      }

      // Wait for DOM element to be available
      await new Promise((resolve) => setTimeout(resolve, 100));

      const qrCode = new Html5Qrcode('qr-reader');
      setHtml5QrCode(qrCode);

      // Try to use back camera first, fallback to any available camera
      let cameraId = null;
      try {
        const backCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear'));
        cameraId = backCamera?.id || devices[0].id;
      } catch (e) {
        cameraId = devices[0].id;
      }

      await qrCode.start(
        cameraId || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code scanned successfully
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          // Only log if it's a critical error
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.debug('QR scanning:', errorMessage);
          }
        }
      );
    } catch (err) {
      console.error('QR scanning error:', err);
      let errorMessage = 'Kamera erişimi reddedildi veya kamera bulunamadı.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera izni verin.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Kamera bulunamadı. Lütfen bir kamera cihazı bağlı olduğundan emin olun.';
      } else if (err.message?.includes('qr-reader')) {
        errorMessage = 'QR kod tarayıcı başlatılamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
      }
      
      setError(errorMessage);
      setScanning(false);
      toast.error('QR kod tarama başlatılamadı');
      
      // Clear html5QrCode if it was set
      if (html5QrCode) {
        setHtml5QrCode(null);
      }
    }
  };

  const stopScanning = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        await html5QrCode.clear();
        setHtml5QrCode(null);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleQRCodeScanned = (decodedText) => {
    // Stop scanning
    stopScanning();

    // Extract session ID from URL
    // Expected format: /attendance/checkin/{sessionId}
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const sessionIdIndex = pathParts.indexOf('checkin');
      
      if (sessionIdIndex !== -1 && pathParts[sessionIdIndex + 1]) {
        const sessionId = pathParts[sessionIdIndex + 1];
        toast.success('QR kod başarıyla okundu!');
        navigate(`/attendance/checkin/${sessionId}`);
      } else {
        // Try to extract session ID directly if it's just a number
        const sessionId = decodedText.split('/').pop();
        if (sessionId && !isNaN(sessionId)) {
          toast.success('QR kod başarıyla okundu!');
          navigate(`/attendance/checkin/${sessionId}`);
        } else {
          throw new Error('Geçersiz QR kod formatı');
        }
      }
    } catch (err) {
      // If it's not a URL, try to use it as session ID directly
      if (decodedText && !isNaN(decodedText)) {
        toast.success('QR kod başarıyla okundu!');
        navigate(`/attendance/checkin/${decodedText}`);
      } else {
        setError('Geçersiz QR kod. Lütfen geçerli bir yoklama QR kodu tarayın.');
        toast.error('Geçersiz QR kod');
      }
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const userLat = result.coords.latitude;
        const userLon = result.coords.longitude;
        setLocation({ lat: userLat, lon: userLon, lng: userLon });
        setIsGettingLocation(false);
        toast.success('Konum başarıyla alındı');
        handleCheckInByCode(userLat, userLon);
      },
      (error) => {
        setIsGettingLocation(false);
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

  const handleCheckInByCode = async (lat, lon) => {
    if (!codeInput.trim()) {
      toast.error('Lütfen yoklama kodunu girin');
      return;
    }

    try {
      setIsSubmitting(true);
      await attendanceService.checkInByCode(codeInput.trim(), {
        lat: lat,
        lng: lon
      });
      toast.success('Yoklama başarıyla kaydedildi!');
      // Başarılı olduktan sonra formu temizle
      setCodeInput('');
      setLocation(null);
    } catch (error) {
      console.error('Check-in by code error:', error);
      toast.error(error.message || 'Yoklamaya katılırken bir hata oluştu');
      setIsGettingLocation(false); // Hata durumunda loading state'ini sıfırla
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = () => {
    if (!codeInput.trim()) {
      toast.error('Lütfen yoklama kodunu girin');
      return;
    }
    getLocation();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          mb={1}
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          QR Kod ile Yoklamaya Katıl
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Yoklama QR kodunu kameraya gösterin
        </Typography>

        <Card 
          elevation={0}
          sx={{
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4} alignItems="center">
              {!scanning && !error && (
                <Fade in={true} timeout={500}>
                  <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 4,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        width: '100%',
                        maxWidth: 400,
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Zoom in={true} timeout={600}>
                          <Box
                            sx={{
                              width: 120,
                              height: 120,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            <QrCodeScannerIcon sx={{ fontSize: 60, color: 'white' }} />
                          </Box>
                        </Zoom>
                        <Typography variant="h5" fontWeight="bold" textAlign="center">
                          QR Kodu Tarayın
                        </Typography>
                        <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                          Yoklama QR kodunu kameraya gösterin. Kamera izni istenecektir.
                        </Typography>
                      </Stack>
                    </Paper>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<CameraAltIcon />}
                      onClick={startScanning}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5568d3 0%, #653a8f 100%)',
                          boxShadow: '0 12px 24px rgba(102, 126, 234, 0.5)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      Kamerayı Aç ve Tara
                    </Button>
                    
                    <Divider sx={{ width: '100%', my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        VEYA
                      </Typography>
                    </Divider>

                    <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
                      <TextField
                        label="Yoklama Kodu"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="Örn: QR-ABC123"
                        fullWidth
                        disabled={isGettingLocation || isSubmitting}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'monospace',
                            fontSize: '1.1rem',
                            letterSpacing: 1,
                          },
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCodeSubmit();
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<LocationSearchingIcon />}
                        onClick={handleCodeSubmit}
                        disabled={!codeInput.trim() || isGettingLocation || isSubmitting}
                        fullWidth
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          borderWidth: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        Kod ile Katıl
                      </Button>
                    </Stack>

                    {(isGettingLocation || isSubmitting) && (
                      <Box sx={{ width: '100%', maxWidth: 400 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                          {isGettingLocation ? 'Konum alınıyor...' : 'Yoklamaya katılılıyor...'}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Fade>
              )}

              {scanning && (
                <Fade in={true} timeout={500}>
                  <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                        <Typography variant="h6" fontWeight="bold">
                          QR Kod Taranıyor...
                        </Typography>
                      </Stack>
                    </Paper>
                    <Box
                      id="qr-reader"
                      sx={{
                        width: '100%',
                        maxWidth: 500,
                        minHeight: 400,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '3px solid',
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                        bgcolor: 'black',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '250px',
                          height: '250px',
                          border: '2px dashed rgba(255, 255, 255, 0.5)',
                          borderRadius: 2,
                          pointerEvents: 'none',
                          zIndex: 1,
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      QR kodu kameraya gösterin
                    </Typography>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<StopIcon />}
                      onClick={stopScanning}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: 3,
                        borderWidth: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      Taramayı Durdur
                    </Button>
                  </Stack>
                </Fade>
              )}

              {error && (
                <Fade in={true} timeout={500}>
                  <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        width: '100%',
                        borderRadius: 3,
                        fontSize: '1rem',
                      }}
                      icon={<QrCodeScannerIcon />}
                    >
                      {error}
                    </Alert>
                    <Stack direction="row" spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                          setError(null);
                          startScanning();
                        }}
                        startIcon={<CameraAltIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        Tekrar Dene
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/attendance/active')}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: 3,
                          borderWidth: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        Aktif Yoklamalar
                      </Button>
                    </Stack>
                  </Stack>
                </Fade>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
