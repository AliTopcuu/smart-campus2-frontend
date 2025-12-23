import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { QrCodeScanner as ScannerIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { eventService } from '@/services/eventService';
import { toast } from 'react-toastify';

export const EventCheckInPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  const startScanning = async () => {
    try {
      setCameraError(null);
      setError(null);

      // Stop existing scanner if any
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop().catch(() => {});
          await html5QrCodeRef.current.clear().catch(() => {});
        } catch (e) {
          // Ignore cleanup errors
        }
        html5QrCodeRef.current = null;
      }

      setIsScanning(true);

      const html5QrCode = new Html5Qrcode('event-qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Prevent multiple requests for the same code
          if (decodedText === lastScannedCodeRef.current || isProcessingRef.current) {
            return;
          }
          
          lastScannedCodeRef.current = decodedText;
          processCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen frequently)
        }
      );
    } catch (err) {
      console.error('Error starting camera:', err);
      setIsScanning(false);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
        setCameraError('Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.');
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('device')) {
        setCameraError('Kamera bulunamadı. Lütfen bir kameranın bağlı olduğundan emin olun.');
      } else {
        setCameraError('Kamera başlatılamadı: ' + (err.message || 'Bilinmeyen hata'));
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (stopErr) {
          if (!stopErr.message?.includes('not running') && !stopErr.message?.includes('not started')) {
            console.error('Error stopping scanner:', stopErr);
          }
        }
        try {
          await html5QrCodeRef.current.clear();
        } catch (clearErr) {
          // Ignore clear errors
        }
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping camera:', err);
      setIsScanning(false);
    }
  };

  const processCode = async (code) => {
    if (isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await eventService.checkIn(code);
      setScanResult(res);
      toast.success(res.message || 'Giriş başarılı!');
      
      // Stop scanning after successful scan
      await stopScanning();
      
      // Allow rescanning after 2 seconds
      setTimeout(() => {
        lastScannedCodeRef.current = null;
        isProcessingRef.current = false;
        startScanning();
      }, 2000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Geçersiz QR Kod veya Hata oluştu';
      setError(msg);
      toast.error(msg);
      
      // Continue scanning on error after delay
      setTimeout(() => {
        lastScannedCodeRef.current = null;
        isProcessingRef.current = false;
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-start scanning when component mounts
    const timer = setTimeout(() => {
      startScanning();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch((err) => {
          // Ignore errors during cleanup
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Etkinlik Giriş Kontrolü
      </Typography>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          id="event-qr-reader"
          sx={{
            width: '100%',
            maxWidth: 400,
            minHeight: 400,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: '#000',
            borderRadius: 2
          }}
        />
        
        {cameraError && (
          <Box sx={{ mt: 2, textAlign: 'center', width: '100%' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {cameraError}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setCameraError(null);
                startScanning();
              }}
            >
              Tekrar Dene
            </Button>
          </Box>
        )}

        {!cameraError && !isScanning && (
          <Button
            variant="contained"
            color="primary"
            onClick={startScanning}
            sx={{ mt: 2 }}
            startIcon={<ScannerIcon />}
          >
            Kamerayı Başlat
          </Button>
        )}

        {isScanning && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={stopScanning}
            sx={{ mt: 2 }}
          >
            Taramayı Durdur
          </Button>
        )}

        <Typography variant="caption" sx={{ mt: 1 }}>
          Kamerayı QR koda tutunuz.
        </Typography>
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Result Display */}
      {scanResult && (
        <Card sx={{ mb: 2, border: '2px solid green' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h5" color="success.main" gutterBottom>
              Başarılı!
            </Typography>
            {scanResult.user && (
              <>
                <Typography variant="h6">
                  {scanResult.user.fullName || scanResult.user.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {scanResult.user.email}
                </Typography>
              </>
            )}
            {scanResult.event && (
              <>
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {scanResult.event.title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {scanResult.event.location}
                </Typography>
              </>
            )}
            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
              Giriş onaylandı
            </Typography>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card sx={{ mb: 2, border: '2px solid red' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Cancel color="error" sx={{ fontSize: 60, mb: 1 }} />
            <Typography variant="h5" color="error.main" gutterBottom>
              Hata!
            </Typography>
            <Typography variant="body1">
              {error}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

