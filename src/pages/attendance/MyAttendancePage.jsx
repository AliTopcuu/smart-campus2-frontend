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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';

export const MyAttendancePage = () => {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.myAttendanceByCourse();
      setCourses(data);
    } catch (err) {
      console.error('Attendance load error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Yoklama kayıtları yüklenemedi';
      setError(errorMessage);
      toast.error(errorMessage);

      // 401 hatası durumunda kullanıcıyı bilgilendir
      if (err?.response?.status === 401) {
        toast.error('Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleAccordionChange = (sectionId) => (event, isExpanded) => {
    setExpandedCourse(isExpanded ? sectionId : null);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
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

  if (courses.length === 0) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Yoklama Durumum
        </Typography>
        <Alert severity="info">Henüz hiçbir derse kayıtlı değilsiniz veya yoklama oturumu bulunmuyor.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Yoklama Durumum
      </Typography>

      <Stack spacing={2}>
        {courses.map((course) => (
          <Card key={course.sectionId} elevation={2}>
            <Accordion
              expanded={expandedCourse === course.sectionId}
              onChange={handleAccordionChange(course.sectionId)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {course.course?.code || 'N/A'} - {course.course?.name || 'Bilinmiyor'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Section {course.sectionNumber}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mr: 2 }}>
                    <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                      <Typography variant="body2" color="text.secondary">
                        Katılım
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {course.attendedCount} / {course.totalSessions}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="body2" color="text.secondary">
                        Yüzde
                      </Typography>
                      <Chip
                        label={`%${course.attendancePercentage}`}
                        color={getPercentageColor(course.attendancePercentage)}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Divider sx={{ mb: 2 }} />
                {course.sessions.length === 0 ? (
                  <Alert severity="info">Bu ders için henüz yoklama oturumu açılmamış.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Başlangıç - Bitiş</TableCell>
                        <TableCell>Durum</TableCell>
                        <TableCell align="center">Katılım</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {course.sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(session.startTime || session.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                session.status === 'active' ? 'Aktif' :
                                  session.status === 'closed' ? 'Kapalı' :
                                    session.status === 'pending' ? 'Bekliyor' :
                                      session.status
                              }
                              color={
                                session.status === 'active' ? 'success' :
                                  session.status === 'closed' ? 'default' :
                                    session.status === 'pending' ? 'warning' :
                                      'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {session.attended ? (
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                <CheckCircleIcon color="success" />
                                {session.isExcused && (
                                  <WarningAmberIcon color="warning" sx={{ fontSize: 20 }} />
                                )}
                                <Typography variant="body2" color="success.main" fontWeight="medium">
                                  {formatTime(session.checkInTime)}
                                </Typography>
                              </Stack>
                            ) : (
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                <CancelIcon color="error" />
                                <Typography variant="body2" color="error.main" fontWeight="medium">
                                  Katılmadı
                                </Typography>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AccordionDetails>
            </Accordion>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};
