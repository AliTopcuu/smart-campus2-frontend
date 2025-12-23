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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { classroomReservationService } from '@/services/classroomReservationService';
import { courseService } from '@/services/courseService';
import { apiClient } from '@/services/apiClient';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/useToast';

export const ClassroomReservationPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData] = useState({
    classroomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get classrooms
  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courses/classrooms');
      return data;
    },
  });

  // Get reservations
  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['classroom-reservations'],
    queryFn: async () => {
      console.log('Fetching reservations...');
      const result = await classroomReservationService.list();
      console.log('Fetched reservations:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // Create reservation mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating reservation with data:', data);
      try {
        const result = await classroomReservationService.create(data);
        console.log('Reservation created successfully:', result);
        return result;
      } catch (error) {
        console.error('Reservation creation error:', error);
        throw error;
      }
    },
    onSuccess: async (newReservation) => {
      console.log('Mutation success, new reservation:', newReservation);
      showToast('Rezervasyon başarıyla oluşturuldu', 'success');
      setOpenDialog(false);
      setFormData({ classroomId: '', date: '', startTime: '', endTime: '', purpose: '' });
      // Update cache immediately
      queryClient.setQueryData(['classroom-reservations'], (old = []) => {
        console.log('Updating cache, old data:', old);
        const updated = [...old, newReservation];
        console.log('Updated cache:', updated);
        return updated;
      });
      // Force refetch
      try {
        const result = await refetch();
        console.log('Refetch result:', result);
      } catch (error) {
        console.error('Refetch error:', error);
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      console.error('Error response:', error.response);
      showToast(error.response?.data?.message || error.message || 'Rezervasyon oluşturulamadı', 'error');
    }
  });

  // Cancel reservation mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => classroomReservationService.cancel(id),
    onSuccess: async (response, cancelledId) => {
      showToast('Rezervasyon iptal edildi', 'success');
      // Update cache immediately by updating reservation status
      queryClient.setQueryData(['classroom-reservations'], (old = []) => {
        return old.map(res => 
          res.id === cancelledId 
            ? { ...res, status: 'cancelled' }
            : res
        );
      });
      // Force refetch
      await refetch();
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Rezervasyon iptal edilemedi', 'error');
    }
  });

  const handleOpenDialog = (classroom = null) => {
    if (classroom) {
      setSelectedClassroom(classroom);
      setFormData({ ...formData, classroomId: classroom.id });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClassroom(null);
    setFormData({ classroomId: '', date: '', startTime: '', endTime: '', purpose: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
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

  const minDate = new Date().toISOString().split('T')[0];

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Derslik Rezervasyonları</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Yeni Rezervasyon
        </Button>
      </Stack>

      {/* Available Classrooms */}
      <Typography variant="h6" mb={2} mt={4}>
        Mevcut Derslikler
      </Typography>
      <Grid container spacing={2} mb={4}>
        {classrooms.map((classroom) => (
          <Grid item xs={12} sm={6} md={4} key={classroom.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {classroom.building} {classroom.roomNumber}
                </Typography>
                <Typography color="text.secondary" mb={1}>
                  Kapasite: {classroom.capacity}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenDialog(classroom)}
                >
                  Rezerve Et
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* My Reservations */}
      <Typography variant="h6" mb={2}>
        Rezervasyonlarım
      </Typography>
      {reservations.length === 0 ? (
        <Alert severity="info">Henüz rezervasyonunuz bulunmamaktadır.</Alert>
      ) : (
        <Grid container spacing={2}>
          {reservations.map((reservation) => (
            <Grid item xs={12} md={6} key={reservation.id}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {reservation.classroom?.building} {reservation.classroom?.roomNumber}
                    </Typography>
                    <Chip
                      label={getStatusLabel(reservation.status)}
                      color={getStatusColor(reservation.status)}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Tarih: {format(new Date(reservation.date), 'dd MMMM yyyy', { locale: tr })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Saat: {reservation.startTime} - {reservation.endTime}
                  </Typography>
                  <Typography variant="body2" mb={2}>
                    Amaç: {reservation.purpose}
                  </Typography>
                  {reservation.status === 'pending' && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => cancelMutation.mutate(reservation.id)}
                      disabled={cancelMutation.isLoading}
                    >
                      İptal Et
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reservation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Derslik Rezervasyonu</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              <FormControl fullWidth>
                <InputLabel>Derslik</InputLabel>
                <Select
                  value={formData.classroomId}
                  label="Derslik"
                  onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                  required
                >
                  {classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id}>
                      {classroom.building} {classroom.roomNumber} (Kapasite: {classroom.capacity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Tarih"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minDate }}
                required
                fullWidth
              />
              <TextField
                label="Başlangıç Saati"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="Bitiş Saati"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="Amaç"
                multiline
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? <CircularProgress size={20} /> : 'Rezerve Et'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

