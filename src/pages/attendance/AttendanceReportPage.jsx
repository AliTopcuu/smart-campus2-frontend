import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const AttendanceReportPage = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.mySessions();
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Yoklama oturumları yüklenemedi');
      toast.error(err.message || 'Yoklama oturumları yüklenemedi');
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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

  if (sessions.length === 0) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Yoklama Raporları
        </Typography>
        <Alert severity="info">Henüz yoklama oturumu oluşturulmamış.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Raporları
      </Typography>

      <Stack spacing={2}>
        {sessions.map((session) => (
          <Card key={session.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <SchoolIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">
                      {session.sectionName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {session.sectionId} • Kod: {session.code}
                    </Typography>
                  </Box>
                  <Chip
                    label={session.status === 'active' ? 'Aktif' : session.status === 'closed' ? 'Kapalı' : session.status}
                    color={session.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {session.recordCount} öğrenci
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Oturum Bilgileri
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Typography variant="body2">
                        <strong>Başlangıç:</strong> {formatDateTime(session.startTime)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Bitiş:</strong> {formatDateTime(session.endTime)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Geofence:</strong> {session.geofenceRadius}m
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider />

                  {session.records && session.records.length > 0 ? (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Katılan Öğrenciler ({session.records.length})
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <PersonIcon fontSize="small" />
                                <span>Öğrenci</span>
                              </Stack>
                            </TableCell>
                            <TableCell>Numara</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <AccessTimeIcon fontSize="small" />
                                <span>Katılım Saati</span>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">Mesafe</TableCell>
                            <TableCell align="center">Durum</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {session.records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {record.student?.fullName || 'Bilinmeyen'}
                                </Typography>
                                {record.student?.email && (
                                  <Typography variant="caption" color="text.secondary">
                                    {record.student.email}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {record.student?.studentNumber || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatTime(record.checkedInAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(record.checkedInAt).toLocaleDateString('tr-TR')}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">
                                  {Math.round(record.distance)}m
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={record.isWithinGeofence ? 'İçinde' : 'Dışında'}
                                  color={record.isWithinGeofence ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  ) : (
                    <Alert severity="info">Bu oturuma henüz öğrenci katılmamış.</Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};
