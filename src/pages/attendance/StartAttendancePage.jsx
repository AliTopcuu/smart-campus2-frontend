import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, LinearProgress, Stack, TextField, Typography, Dialog, DialogContent, DialogTitle, DialogActions, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const StartAttendancePage = () => {
  const toast = useToast();
  const [sectionId, setSectionId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [radius, setRadius] = useState(250); // Default 250 metre
  const [duration, setDuration] = useState(30);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [classroomLocation, setClassroomLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const getInstructorLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const location = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          accuracy: result.coords.accuracy,
        };
        setClassroomLocation(location);
        setIsGettingLocation(false);
        toast.success('Sınıf konumu başarıyla alındı. Şimdi oturumu başlatabilirsiniz.');
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

  const handleStartSession = async () => {
    if (!sectionId || !sectionName) {
      toast.error('Lütfen Section ID ve Section Name alanlarını doldurun');
      return;
    }

    // Eğer konum alınmadıysa, RTÜ kampüs konumunu default olarak kullan
    const location = classroomLocation || {
      lat: 41.036667, // RTÜ Zihni Derin Kampüsü default koordinatları (41°2'12"N)
      lng: 40.494167, // RTÜ Zihni Derin Kampüsü default koordinatları (40°29'39"E)
      accuracy: null,
    };

    try {
      setIsCreating(true);
      const result = await attendanceService.startSession({
        sectionId,
        sectionName,
        locationLat: location.lat,
        locationLng: location.lng,
        geofenceRadius: radius,
        duration: duration
      });

      setSessionInfo({
        id: result.id,
        code: result.code,
        expiresAt: new Date(result.endTime).toLocaleTimeString('tr-TR'),
        location: result.location,
        radius: result.geofenceRadius,
      });
      toast.success(`Yoklama oturumu başarıyla oluşturuldu! Kod: ${result.code}`);
    } catch (error) {
      toast.error(error.message || 'Yoklama oturumu oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Başlat
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Section ID"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              placeholder="Örn: CENG204-SEC01"
              required
              fullWidth
            />
            <TextField
              label="Section Name"
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
              placeholder="Örn: Veri Yapıları ve Algoritmalar - Section 01"
              required
              fullWidth
            />
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              onClick={getInstructorLocation}
              disabled={isGettingLocation}
              fullWidth
            >
              {isGettingLocation ? 'Konum alınıyor...' : 'Sınıf Konumunu Al (Cihazımdan)'}
            </Button>

            {isGettingLocation && <LinearProgress />}

            {classroomLocation && (
              <Alert severity="success">
                Sınıf konumu alındı: {classroomLocation.lat.toFixed(6)}, {classroomLocation.lng.toFixed(6)}
                {classroomLocation.accuracy && ` (±${Math.round(classroomLocation.accuracy)}m)`}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Geofence Yarıçapı (metre)"
                type="number"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                fullWidth
                helperText="Kampüs çevresindeki yarıçap (default: 250m)"
              />
              <TextField
                label="Süre (dakika)"
                type="number"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                fullWidth
              />
            </Stack>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSession}
              disabled={isGettingLocation || isCreating || !sectionId || !sectionName}
            >
              {isCreating ? 'Oluşturuluyor...' : 'Oturumu Başlat'}
            </Button>
            {sessionInfo && (
              <Alert severity="success">
                <Typography variant="body1" gutterBottom>
                  <strong>Yoklama Oturumu Başarıyla Oluşturuldu!</strong>
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                  <Box>
                    <Typography variant="body2">
                      <strong>Kod:</strong> {sessionInfo.code}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Süre sonu:</strong> {sessionInfo.expiresAt}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Konum:</strong> {sessionInfo.location.lat.toFixed(6)}, {sessionInfo.location.lng.toFixed(6)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Geofence Yarıçapı:</strong> {sessionInfo.radius}m
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => {
                      if (sessionInfo?.id) {
                        setShowQRCode(true);
                      } else {
                        toast.error('QR kod oluşturulamadı. Lütfen sayfayı yenileyin.');
                      }
                    }}
                    sx={{ mt: 1 }}
                  >
                    QR Kod Göster
                  </Button>
                </Stack>
              </Alert>
            )}
            
            {/* QR Code Dialog */}
            <Dialog 
              open={showQRCode && !!sessionInfo?.id} 
              onClose={() => setShowQRCode(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Yoklama QR Kodu</Typography>
                  <IconButton onClick={() => setShowQRCode(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </DialogTitle>
              <DialogContent>
                {sessionInfo?.id ? (
                  <Stack spacing={3} alignItems="center">
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <QRCodeSVG
                        value={`${window.location.origin}/attendance/checkin/${sessionInfo.id}`}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Öğrenciler bu QR kodu tarayarak yoklamaya katılabilir
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Kod: <strong>{sessionInfo?.code}</strong>
                  </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        const svg = document.querySelector('svg');
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob((blob) => {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `yoklama-qr-${sessionInfo.code}.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            });
                          };
                          img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                        }
                      }}
                    >
                      QR Kodu İndir
                    </Button>
                  </Stack>
                ) : (
                  <Alert severity="error">QR kod oluşturulamadı. Lütfen sayfayı yenileyin.</Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowQRCode(false)}>Kapat</Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

