import { useState, useEffect, useMemo } from 'react';
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
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useToast } from '@/hooks/useToast';
import { attendanceService } from '@/services/attendanceService';
import { sectionService } from '@/services/sectionService';

export const AttendanceReportPage = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
    loadSections();
  }, []);

  useEffect(() => {
    // Section filtresine göre session'ları filtrele
    if (selectedSectionId === '') {
      setSessions(allSessions);
    } else {
      const filtered = allSessions.filter(session => session.sectionId === parseInt(selectedSectionId));
      setSessions(filtered);
    }
  }, [selectedSectionId, allSessions]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.mySessions();
      setAllSessions(data);
      setSessions(data);
    } catch (err) {
      setError(err.message || 'Yoklama oturumları yüklenemedi');
      toast.error(err.message || 'Yoklama oturumları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      setLoadingSections(true);
      const data = await sectionService.mySections();
      setSections(data);
    } catch (err) {
      console.error('Sections yüklenemedi:', err);
    } finally {
      setLoadingSections(false);
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
      second: '2-digit',
      timeZone: 'Europe/Istanbul',
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

  if (sessions.length === 0 && !loading) {
    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Yoklama Raporları
          </Typography>
          <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel id="section-filter-label-empty">
              <Stack direction="row" spacing={1} alignItems="center">
                <FilterListIcon fontSize="small" />
                <span>Ders Filtrele</span>
              </Stack>
            </InputLabel>
            <Select
              labelId="section-filter-label-empty"
              value={selectedSectionId}
              label="Ders Filtrele"
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={loadingSections}
            >
              <MenuItem value="">
                <em>Tüm Dersler</em>
              </MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.course?.code || 'N/A'} - {section.course?.name || 'Bilinmeyen Ders'} 
                  {section.sectionNumber && ` (Section ${section.sectionNumber})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Alert severity="info">
          {selectedSectionId 
            ? 'Seçili ders için henüz yoklama oturumu oluşturulmamış.' 
            : 'Henüz yoklama oturumu oluşturulmamış.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Yoklama Raporları
        </Typography>
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel id="section-filter-label">
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListIcon fontSize="small" />
              <span>Ders Filtrele</span>
            </Stack>
          </InputLabel>
          <Select
            labelId="section-filter-label"
            value={selectedSectionId}
            label="Ders Filtrele"
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={loadingSections}
          >
            <MenuItem value="">
              <em>Tüm Dersler</em>
            </MenuItem>
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                {section.course?.code || 'N/A'} - {section.course?.name || 'Bilinmeyen Ders'} 
                {section.sectionNumber && ` (Section ${section.sectionNumber})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {selectedSectionId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {sections.find(s => s.id === parseInt(selectedSectionId))?.course?.code || 'Seçili ders'} 
          {' '}dersine ait {sessions.length} yoklama oturumu gösteriliyor.
        </Alert>
      )}

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
                                  {formatTime(record.checkInTime || record.checkedInAt)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(record.checkInTime || record.checkedInAt).toLocaleDateString('tr-TR')}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">
                                  {record.distanceFromCenter || record.distance 
                                    ? `${Math.round(record.distanceFromCenter || record.distance)}m`
                                    : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                                  {record.isExcused && (
                                    <WarningAmberIcon color="warning" sx={{ fontSize: 20 }} />
                                  )}
                                  <Chip
                                    label={record.isExcused ? 'Mazeretli' : (record.isFlagged ? 'İşaretli' : (record.isWithinGeofence !== false ? 'Normal' : 'Dışında'))}
                                    color={record.isExcused ? 'warning' : (record.isFlagged ? 'warning' : (record.isWithinGeofence !== false ? 'success' : 'error'))}
                                    size="small"
                                  />
                                </Stack>
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
