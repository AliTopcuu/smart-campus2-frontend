import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const ActiveSessionsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getActiveSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Aktif yoklamalar yüklenirken bir hata oluştu');
      toast.error('Aktif yoklamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isSessionActive = (session) => {
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);
    return now >= startTime && now <= endTime;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadActiveSessions}>
          Tekrar Dene
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Aktif Yoklamalar</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => navigate('/attendance/scan')}
          >
            QR Kod Tara
          </Button>
          <Button variant="outlined" onClick={loadActiveSessions}>
            Yenile
          </Button>
        </Stack>
      </Stack>

      {sessions.length === 0 ? (
        <Alert severity="info">
          Şu anda aktif yoklama bulunmamaktadır.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {sessions.map((session) => (
            <Grid item xs={12} md={6} key={session.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: isSessionActive(session) ? 'pointer' : 'default',
                  '&:hover': isSessionActive(session) ? {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  } : {}
                }}
                onClick={() => isSessionActive(session) && navigate(`/attendance/checkin/${session.id}`)}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <SchoolIcon color="primary" />
                        <Box>
                          <Typography variant="h6">
                            {session.sectionId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {session.sectionName}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={isSessionActive(session) ? 'Aktif' : 'Beklemede'}
                        color={isSessionActive(session) ? 'success' : 'default'}
                        size="small"
                      />
                    </Stack>

                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Başlangıç:</strong> {formatTime(session.startTime)} - {formatDate(session.startTime)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Bitiş:</strong> {formatTime(session.endTime)} - {formatDate(session.endTime)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Geofence Yarıçapı:</strong> {session.geofenceRadius}m
                        </Typography>
                      </Stack>
                      {session.instructor && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            <strong>Hoca:</strong> {session.instructor.name}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    {isSessionActive(session) && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/attendance/checkin/${session.id}`);
                        }}
                      >
                        Yoklamaya Katıl
                      </Button>
                    )}

                    {!isSessionActive(session) && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {new Date() < new Date(session.startTime) 
                          ? 'Yoklama henüz başlamadı' 
                          : 'Yoklama süresi doldu'}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

