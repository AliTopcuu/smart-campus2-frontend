import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const MyAttendancePage = () => {
  const toast = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.myAttendance();
      setAttendanceRecords(data);
    } catch (err) {
      setError(err.message || 'Yoklama kayıtları yüklenemedi');
      toast.error(err.message || 'Yoklama kayıtları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (attendanceRecords.length === 0) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Yoklama Durumum
        </Typography>
        <Alert severity="info">Henüz hiçbir yoklamaya katılmadınız.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Durumum
      </Typography>

      <Stack spacing={3}>
        {attendanceRecords.map((record) => (
          <Card key={record.id} elevation={2}>
            <CardContent>
              <Stack spacing={2}>
                {/* Session Info */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {record.session?.sectionName || record.session?.sectionId || 'Bilinmeyen Ders'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.session?.sectionId && (
                        <>
                          {record.session.sectionId}
                          {record.session?.code && ` • Kod: ${record.session.code}`}
                        </>
                      )}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={record.isWithinGeofence ? 'Geofence İçinde' : 'Geofence Dışında'}
                    color={record.isWithinGeofence ? 'success' : 'warning'}
                    size="small"
                  />
                </Stack>

                <Divider />

                {/* Attendance Details */}
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" color="text.secondary">
                          Katılım Tarihi ve Saati
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(record.checkedInAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(record.checkedInAt)}
                      </Typography>
                    </Box>

                    {record.session?.startTime && (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Oturum Zamanı
                          </Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight="medium">
                          {formatTime(record.session.startTime)} - {formatTime(record.session.endTime)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(record.session.startTime)}
                        </Typography>
                      </Box>
                    )}

                    {record.distance !== undefined && (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Mesafe
                          </Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight="medium">
                          {Math.round(record.distance)}m
                        </Typography>
                        {record.session?.geofenceRadius && (
                          <Typography variant="body2" color="text.secondary">
                            Geofence: {record.session.geofenceRadius}m
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};
