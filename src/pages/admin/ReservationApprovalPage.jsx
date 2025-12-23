import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { classroomReservationService } from '@/services/classroomReservationService';
import { apiClient } from '@/services/apiClient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/useToast';

export const ReservationApprovalPage = () => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get all reservations (admin sees all)
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['classroom-reservations'],
    queryFn: () => classroomReservationService.list(),
  });

  // Get sections for a specific classroom to show schedule
  const { data: classroomSchedule = [] } = useQuery({
    queryKey: ['classroom-schedule', selectedReservation?.classroomId],
    queryFn: async () => {
      if (!selectedReservation?.classroomId) return [];
      const { data } = await apiClient.get('/sections', {
        params: { classroomId: selectedReservation.classroomId }
      });
      return data || [];
    },
    enabled: !!selectedReservation?.classroomId && scheduleDialogOpen,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id) => classroomReservationService.approve(id),
    onSuccess: () => {
      showToast('Rezervasyon onaylandı', 'success');
      queryClient.invalidateQueries(['classroom-reservations']);
      setScheduleDialogOpen(false);
      setSelectedReservation(null);
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Rezervasyon onaylanamadı', 'error');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => classroomReservationService.reject(id),
    onSuccess: () => {
      showToast('Rezervasyon reddedildi', 'success');
      queryClient.invalidateQueries(['classroom-reservations']);
      setScheduleDialogOpen(false);
      setSelectedReservation(null);
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Rezervasyon reddedilemedi', 'error');
    }
  });

  const handleViewSchedule = (reservation) => {
    setSelectedReservation(reservation);
    setScheduleDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedReservation(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
  };

  // Check if reservation conflicts with schedule
  const checkConflict = (reservation, schedule) => {
    if (!schedule || schedule.length === 0) return false;

    const reservationDate = new Date(reservation.date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const reservationDay = dayNames[reservationDate.getDay()].toLowerCase();

    const resStart = timeToMinutes(reservation.startTime);
    const resEnd = timeToMinutes(reservation.endTime);

    for (const section of schedule) {
      if (!section.scheduleJson) continue;
      let scheduleJson = section.scheduleJson;
      if (typeof scheduleJson === 'string') {
        try {
          scheduleJson = JSON.parse(scheduleJson);
        } catch (e) {
          continue;
        }
      }

      if (Array.isArray(scheduleJson.scheduleItems)) {
        for (const item of scheduleJson.scheduleItems) {
          if (item.day && item.day.toLowerCase() === reservationDay) {
            const itemStart = timeToMinutes(item.startTime);
            const itemEnd = timeToMinutes(item.endTime);
            if (resStart < itemEnd && resEnd > itemStart) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const hasConflict = selectedReservation && checkConflict(selectedReservation, classroomSchedule);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" mb={3}>
        Rezervasyon Onayları
      </Typography>

      {pendingReservations.length === 0 ? (
        <Alert severity="info">Bekleyen rezervasyon bulunmamaktadır.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Derslik</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Saat</TableCell>
                  <TableCell>Amaç</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      {reservation.classroom?.building} {reservation.classroom?.roomNumber}
                    </TableCell>
                    <TableCell>
                      {reservation.user?.fullName || reservation.user?.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(reservation.date), 'dd MMMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>
                      {reservation.startTime} - {reservation.endTime}
                    </TableCell>
                    <TableCell>{reservation.purpose}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(reservation.status)}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewSchedule(reservation)}
                        sx={{ mr: 1 }}
                      >
                        Ders Programını Gör
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Derslik Programı ve Rezervasyon Detayı
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Stack spacing={3} mt={1}>
              {/* Reservation Details */}
              <Box>
                <Typography variant="h6" mb={2}>Rezervasyon Bilgileri</Typography>
                <Stack spacing={1}>
                  <Typography>
                    <strong>Derslik:</strong> {selectedReservation.classroom?.building} {selectedReservation.classroom?.roomNumber}
                  </Typography>
                  <Typography>
                    <strong>Kullanıcı:</strong> {selectedReservation.user?.fullName || selectedReservation.user?.email}
                  </Typography>
                  <Typography>
                    <strong>Tarih:</strong> {format(new Date(selectedReservation.date), 'dd MMMM yyyy', { locale: tr })}
                  </Typography>
                  <Typography>
                    <strong>Saat:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}
                  </Typography>
                  <Typography>
                    <strong>Amaç:</strong> {selectedReservation.purpose}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              {/* Classroom Schedule - Only show times when this classroom is used */}
              <Box>
                <Typography variant="h6" mb={2}>
                  Derslik Kullanım Zamanları
                </Typography>
                {(() => {
                  // Collect all schedule items from all sections
                  const allScheduleItems = [];
                  classroomSchedule.forEach((section) => {
                    let scheduleJson = section.scheduleJson;
                    if (typeof scheduleJson === 'string') {
                      try {
                        scheduleJson = JSON.parse(scheduleJson);
                      } catch (e) {
                        return;
                      }
                    }

                    if (scheduleJson && Array.isArray(scheduleJson.scheduleItems)) {
                      scheduleJson.scheduleItems.forEach((item) => {
                        if (item.day && item.startTime && item.endTime) {
                          allScheduleItems.push({
                            ...item,
                            courseCode: section.course?.code || 'N/A',
                            sectionNumber: section.sectionNumber,
                            instructor: section.instructor?.fullName || 'TBA'
                          });
                        }
                      });
                    }
                  });

                  // Filter by reservation day
                  const reservationDate = new Date(selectedReservation.date);
                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const reservationDay = dayNames[reservationDate.getDay()].toLowerCase();
                  
                  const dayScheduleItems = allScheduleItems.filter(item => {
                    const itemDay = item.day?.toLowerCase();
                    return itemDay === reservationDay;
                  });

                  if (dayScheduleItems.length === 0) {
                    return (
                      <Alert severity="info">
                        Bu derslik {format(new Date(selectedReservation.date), 'EEEE', { locale: tr })} günü kullanılmamaktadır.
                      </Alert>
                    );
                  }

                  // Sort by start time
                  dayScheduleItems.sort((a, b) => {
                    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
                  });

                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Ders</TableCell>
                          <TableCell>Section</TableCell>
                          <TableCell>Saat</TableCell>
                          <TableCell>Eğitmen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dayScheduleItems.map((item, idx) => {
                          // Check if this schedule item conflicts with reservation
                          const resStart = timeToMinutes(selectedReservation.startTime);
                          const resEnd = timeToMinutes(selectedReservation.endTime);
                          const itemStart = timeToMinutes(item.startTime);
                          const itemEnd = timeToMinutes(item.endTime);
                          const isConflict = resStart < itemEnd && resEnd > itemStart;

                          return (
                            <TableRow 
                              key={`${idx}`} 
                              sx={{ bgcolor: isConflict ? 'error.light' : 'transparent' }}
                            >
                              <TableCell>{item.courseCode}</TableCell>
                              <TableCell>Section {item.sectionNumber}</TableCell>
                              <TableCell>{item.startTime} - {item.endTime}</TableCell>
                              <TableCell>{item.instructor}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>

              {hasConflict && (
                <Alert severity="warning">
                  UYARI: Bu rezervasyon ders programı ile çakışmaktadır!
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Kapat</Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={() => rejectMutation.mutate(selectedReservation.id)}
            disabled={rejectMutation.isLoading || approveMutation.isLoading}
          >
            Reddet
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => approveMutation.mutate(selectedReservation.id)}
            disabled={rejectMutation.isLoading || approveMutation.isLoading}
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

