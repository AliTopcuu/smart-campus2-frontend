import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';

export const GiveAttendancePage = () => {
  const { sessionId } = useParams();
  const toast = useToast();
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle');

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum servislerini desteklemiyor.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setLocation({ lat: result.coords.latitude, lon: result.coords.longitude });
        setStatus('ready');
      },
      () => toast.error('Konum alınamadı. Lütfen izin verdiğinizden emin olun.')
    );
  };

  const handleSubmit = () => {
    setStatus('success');
    toast.success('Yoklama mock olarak kaydedildi');
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Ver
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Oturum ID: <strong>{sessionId}</strong>
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LocationSearchingIcon />}
              onClick={getLocation}
            >
              Konumumu Al
            </Button>
            {location && (
              <Alert severity="info">
                Koordinatlar: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
              </Alert>
            )}
            <Button
              variant="contained"
              disabled={status !== 'ready'}
              startIcon={<CheckCircleIcon />}
              onClick={handleSubmit}
            >
              Yoklamayı Gönder
            </Button>
            {status === 'success' && (
              <Alert severity="success">Yoklama başarıyla kaydedildi.</Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

