import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import { eventService } from '@/services/eventService';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const EventManagementPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    endDate: '',
    location: '',
    capacity: '',
    status: 'active',
    surveySchema: null,
  });

  const categoryOptions = [
    { value: 'academic', label: 'Akademik' },
    { value: 'social', label: 'Sosyal' },
    { value: 'sports', label: 'Spor' },
    { value: 'cultural', label: 'Kültürel' },
    { value: 'career', label: 'Kariyer' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminer' },
    { value: 'conference', label: 'Konferans' },
  ];

  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => eventService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => eventService.create(payload),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Etkinlik oluşturulurken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => eventService.update(id, payload),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Etkinlik güncellenirken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => eventService.delete(id),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Etkinlik silinirken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const handleOpenDialog = (event = null) => {
    if (event) {
      setEditingEvent(event);
      // Format date for input (YYYY-MM-DDTHH:mm)
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      const formattedEndDate = event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '';
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || '',
        date: formattedDate,
        endDate: formattedEndDate,
        location: event.location || '',
        capacity: event.capacity?.toString() || '',
        status: event.status || 'active',
        surveySchema: event.surveySchema || null,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        date: '',
        endDate: '',
        location: '',
        capacity: '',
        status: 'active',
        surveySchema: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      date: '',
      endDate: '',
      location: '',
      capacity: '',
      status: 'active',
      surveySchema: null,
    });
  };

  const handleSubmit = () => {
    const payload = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category || null,
      date: formData.date,
      endDate: formData.endDate || null,
      location: formData.location,
      capacity: parseInt(formData.capacity, 10),
      status: formData.status,
      surveySchema: formData.surveySchema || null,
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (event) => {
    if (window.confirm(`"${event.title}" etkinliğini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(event.id);
    }
  };

  const getCapacityPercentage = (current, capacity) => {
    if (capacity === 0) return 0;
    return Math.round((current / capacity) * 100);
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Etkinlikler yükleniyor...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Etkinlik Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Etkinlik
        </Button>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
          sx={{ mb: 3 }}
        >
          Etkinlikler alınırken bir hata oluştu.
        </Alert>
      )}

      <Card>
        <CardContent>
          {events.length === 0 ? (
            <Alert severity="info">Henüz etkinlik bulunmamaktadır.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Başlık</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Konum</TableCell>
                  <TableCell align="center">Kapasite</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event) => {
                  const capacityPercentage = getCapacityPercentage(event.currentParticipants, event.capacity);
                  const capacityColor = getCapacityColor(capacityPercentage);
                  const eventDate = new Date(event.date);
                  const isPast = eventDate < new Date();

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {event.title}
                        </Typography>
                        {event.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {event.description.length > 50
                              ? `${event.description.substring(0, 50)}...`
                              : event.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.category ? (
                          <Chip
                            label={categoryOptions.find(c => c.value === event.category)?.label || event.category}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(eventDate, 'dd MMM yyyy, HH:mm')}
                        </Typography>
                        {isPast && (
                          <Chip label="Geçmiş" size="small" color="default" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.location}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ minWidth: 100 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              {event.currentParticipants} / {event.capacity}
                            </Typography>
                            <Typography variant="caption" color={`${capacityColor}.main`} fontWeight="bold">
                              {capacityPercentage}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(capacityPercentage, 100)}
                            color={capacityColor}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            (event.computedStatus || event.status) === 'upcoming'
                              ? 'Yaklaşan'
                              : (event.computedStatus || event.status) === 'active'
                                ? 'Aktif'
                                : (event.computedStatus || event.status) === 'cancelled'
                                  ? 'İptal'
                                  : 'Tamamlandı'
                          }
                          color={
                            (event.computedStatus || event.status) === 'upcoming'
                              ? 'info'
                              : (event.computedStatus || event.status) === 'active'
                                ? 'success'
                                : (event.computedStatus || event.status) === 'cancelled'
                                  ? 'error'
                                  : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(event)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(event)}
                          color="error"
                          disabled={deleteMutation.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Oluştur'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Başlık"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Kategori"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
              required
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Başlangıç Tarihi"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Bitiş Tarihi"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: formData.date }}
            />
            <TextField
              label="Konum"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Kapasite"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            {editingEvent && (
              <TextField
                select
                label="Durum"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="cancelled">İptal</MenuItem>
                <MenuItem value="completed">Tamamlandı</MenuItem>
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !formData.title ||
              !formData.category ||
              !formData.date ||
              !formData.endDate ||
              !formData.location ||
              !formData.capacity ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Kaydediliyor...'
              : editingEvent
                ? 'Güncelle'
                : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

