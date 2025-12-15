import { useState, useEffect } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, LinearProgress, MenuItem, Stack, TextField, Typography, Dialog, DialogContent, DialogTitle, DialogActions, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';
import { sectionService } from '@/services/sectionService';

export const StartAttendancePage = () => {
  const toast = useToast();
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [radius, setRadius] = useState(250); // Default 250 metre
  const [duration, setDuration] = useState(30);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [classroomLocation, setClassroomLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoadingSections(true);
      const response = await sectionService.mySections();
      const sectionsData = Array.isArray(response) ? response : response.data || [];
      setSections(sectionsData);
      
      if (sectionsData.length === 0) {
        toast.error('Size atanmış section bulunamadı. Lütfen admin ile iletişime geçin.');
      }
    } catch (error) {
      toast.error('Section\'lar yüklenemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingSections(false);
    }
  };

  const selectedSection = sections.find(s => s.id === parseInt(selectedSectionId));

  const getInstructorLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Konum alınıyor... Lütfen bekleyin.');

    // watchPosition kullanarak daha iyi sonuç alabiliriz
    let watchId = null;
    let timeoutId = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // 30 saniye sonra timeout
    timeoutId = setTimeout(() => {
      cleanup();
      setIsGettingLocation(false);
      toast.warning('Konum alma işlemi uzun sürüyor. Varsayılan konumu kullanabilirsiniz.');
    }, 30000);

    watchId = navigator.geolocation.watchPosition(
      (result) => {
        cleanup();
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
        cleanup();
        setIsGettingLocation(false);
        let errorMessage = 'Konum alınamadı.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi alınamıyor. GPS\'inizin açık olduğundan emin olun.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum alma işlemi zaman aşımına uğradı. Varsayılan konumu kullanabilirsiniz.';
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: false, // High accuracy daha yavaş, false yaparak hızlandırıyoruz
        timeout: 25000, // 25 saniye timeout
        maximumAge: 120000, // 2 dakika önceki konumu kabul et (daha hızlı)
      }
    );
  };

  const handleStartSession = async () => {
    if (!selectedSectionId) {
      toast.error('Lütfen bir section seçin');
      return;
    }

    if (!classroomLocation) {
      toast.error('Lütfen önce sınıf konumunu alın');
      return;
    }

    // Tarih ve saat hesaplama
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    const startTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm formatı
    const endTime = duration 
      ? new Date(now.getTime() + duration * 60000).toTimeString().split(' ')[0].substring(0, 5)
      : null;

    try {
      setIsCreating(true);
      const result = await attendanceService.startSession({
        sectionId: parseInt(selectedSectionId),
        latitude: classroomLocation.lat,
        longitude: classroomLocation.lng,
        geofenceRadius: radius,
        date: date,
        startTime: startTime,
        endTime: endTime
      });

      setSessionInfo({
        id: result.id,
        qrCode: result.qrCode,
        expiresAt: result.endTime ? new Date(`${result.date} ${result.endTime}`).toLocaleTimeString('tr-TR') : 'Açık',
        location: { lat: result.latitude, lng: result.longitude },
        radius: result.geofenceRadius,
      });
      toast.success('Yoklama oturumu başarıyla oluşturuldu!');
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
            {loadingSections ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : sections.length === 0 ? (
              <Alert severity="warning">
                Size atanmış section bulunamadı. Lütfen admin ile iletişime geçin.
              </Alert>
            ) : (
              <>
                <TextField
                  select
                  label="Section Seçin"
                  value={selectedSectionId}
                  onChange={(event) => setSelectedSectionId(event.target.value)}
                  required
                  fullWidth
                  helperText="Yoklama başlatmak istediğiniz section'ı seçin"
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.course?.code || 'N/A'} - {section.course?.name || 'N/A'} - Section {section.sectionNumber} ({section.semester} {section.year})
                    </MenuItem>
                  ))}
                </TextField>

                {selectedSection && (
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Seçilen Section:</strong> {selectedSection.course?.code} - {selectedSection.course?.name}
                    </Typography>
                    <Typography variant="body2">
                      Section {selectedSection.sectionNumber} • {selectedSection.semester} {selectedSection.year}
                    </Typography>
                  </Alert>
                )}
              </>
            )}
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={getInstructorLocation}
                disabled={isGettingLocation}
                sx={{ flex: 1 }}
              >
                {isGettingLocation ? 'Konum alınıyor...' : 'Sınıf Konumunu Al (Cihazımdan)'}
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  // RTÜ Zihni Derin Kampüsü default koordinatları
                  setClassroomLocation({
                    lat: 41.036667,
                    lng: 40.494167,
                    accuracy: null,
                  });
                  toast.info('Varsayılan kampüs konumu kullanılıyor.');
                }}
                disabled={isGettingLocation}
                sx={{ minWidth: 150 }}
              >
                Varsayılan Konum
              </Button>
            </Stack>

            {isGettingLocation && (
              <Box>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Konum alınıyor... Bu işlem 30 saniyeye kadar sürebilir. Beklemek istemiyorsanız "Varsayılan Konum" butonunu kullanabilirsiniz.
                </Typography>
              </Box>
            )}

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
              disabled={isGettingLocation || isCreating || !selectedSectionId || !classroomLocation || sections.length === 0}
              fullWidth
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
                        id="qr-code-svg"
                        value={`${window.location.origin}/attendance/give/${sessionInfo.id}`}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </Box>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Öğrenciler bu QR kodu tarayarak yoklamaya katılabilir
                  </Typography>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Session ID: <strong>{sessionInfo?.id}</strong>
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

