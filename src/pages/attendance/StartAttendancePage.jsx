import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import { useToast } from '@/hooks/useToast';

const mockSections = [
  { id: 'SEC-01', label: 'CENG204 - Section 01' },
  { id: 'SEC-02', label: 'CENG204 - Section 02' },
];

export const StartAttendancePage = () => {
  const toast = useToast();
  const [section, setSection] = useState(mockSections[0].id);
  const [radius, setRadius] = useState(15);
  const [duration, setDuration] = useState(30);
  const [sessionInfo, setSessionInfo] = useState(null);

  const handleStartSession = () => {
    const code = `QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setSessionInfo({
      code,
      expiresAt: new Date(Date.now() + duration * 60000).toLocaleTimeString(),
    });
    toast.success('Yoklama oturumu başlatıldı (mock)');
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
              select
              label="Section"
              value={section}
              onChange={(event) => setSection(event.target.value)}
            >
              {mockSections.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Geofence (metre)"
                type="number"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                fullWidth
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
            >
              Oturumu Başlat
            </Button>
            {sessionInfo && (
              <Alert severity="success">
                QR Kodu: <strong>{sessionInfo.code}</strong> • Süre sonu: {sessionInfo.expiresAt}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

