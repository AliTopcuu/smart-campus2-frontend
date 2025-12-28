import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { eventService } from '@/services/eventService';
import { useToast } from '@/hooks/useToast';
import { tokenStorage } from '@/utils/tokenStorage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Check if user is admin
  const user = tokenStorage.getUser();
  const isAdmin = user?.role === 'admin';

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => (id ? eventService.getById(id) : Promise.reject()),
    enabled: Boolean(id),
  });

  // Fetch participants if admin
  const { 
    data: participantsData, 
    isLoading: isLoadingParticipants,
    isError: isErrorParticipants,
    error: participantsError,
    refetch: refetchParticipants 
  } = useQuery({
    queryKey: ['event-participants', id],
    queryFn: () => (id ? eventService.getParticipants(id) : Promise.reject()),
    enabled: Boolean(id && isAdmin),
    retry: 1,
  });

  // Fetch waitlist if admin
  const { 
    data: waitlistData, 
    isLoading: isLoadingWaitlist,
    isError: isErrorWaitlist,
    error: waitlistError,
    refetch: refetchWaitlist 
  } = useQuery({
    queryKey: ['event-waitlist', id],
    queryFn: () => (id ? eventService.getWaitlist(id) : Promise.reject()),
    enabled: Boolean(id && isAdmin),
    retry: 1,
  });

  const removeParticipantMutation = useMutation({
    mutationFn: ({ eventId, registrationId }) => eventService.removeParticipant(eventId, registrationId),
    onSuccess: () => {
      toast.success('Katılımcı başarıyla kaldırıldı');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['event-participants', id] });
      queryClient.invalidateQueries({ queryKey: ['event-waitlist', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteDialogOpen(false);
      setSelectedRegistrationId(null);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Katılımcı kaldırılırken hata oluştu';
      toast.error(errorMessage);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (eventId) => eventService.register(eventId),
    onSuccess: (data) => {
      toast.success(data.message || 'Kayıt başarılı!');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      setRegisterDialogOpen(false);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Kayıt sırasında hata oluştu';
      toast.error(errorMessage);
    },
  });

  const handleRegisterClick = () => {
    if (!canRegister) {
      toast.error(getDisabledReason());
      return;
    }
    setRegisterDialogOpen(true);
  };

  const handleConfirmRegister = () => {
    if (!id) {
      toast.error('Etkinlik ID bulunamadı');
      return;
    }
    registerMutation.mutate(parseInt(id, 10));
  };

  const handleDeleteClick = (registrationId) => {
    setSelectedRegistrationId(registrationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!id || !selectedRegistrationId) {
      toast.error('Eksik bilgi');
      return;
    }
    removeParticipantMutation.mutate({
      eventId: parseInt(id, 10),
      registrationId: selectedRegistrationId
    });
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
        <Typography mt={2}>Etkinlik bilgileri yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError || !event) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        Etkinlik bilgisi alınamadı.
      </Alert>
    );
  }

  const eventDate = new Date(event.date);
  // Only check if date is in the past (ignore time, only date)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDateOnly = new Date(eventDate);
  eventDateOnly.setHours(0, 0, 0, 0);
  const isPast = eventDateOnly < today;
  const isFull = event.currentParticipants >= event.capacity;
  const capacityPercentage = getCapacityPercentage(event.currentParticipants, event.capacity);
  const capacityColor = getCapacityColor(capacityPercentage);
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  // Allow registration if event is active and not past (even if full, show waitlist option)
  const canRegister = event.status === 'active' && !isPast && !isCancelled && !isCompleted;
  
  // Get disabled reason message
  const getDisabledReason = () => {
    if (isCancelled) return 'Bu etkinlik iptal edilmiş. Kayıt yapılamaz.';
    if (isCompleted || isPast) return 'Bu etkinlik bitmiş. Kayıt yapılamaz.';
    if (event.status !== 'active') return 'Bu etkinlik kayıt almıyor.';
    return '';
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/events')}
        sx={{ mb: 2 }}
      >
        Geri
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Chip
              label={event.status === 'active' ? 'Aktif' : event.status === 'cancelled' ? 'İptal' : 'Tamamlandı'}
              color={event.status === 'active' ? 'primary' : event.status === 'cancelled' ? 'error' : 'default'}
            />
            {isPast && <Chip label="Geçmiş" color="default" />}
            {isFull && <Chip label="Dolu" color="error" />}
          </Stack>
          <Typography variant="h4" mb={2}>
            {event.title}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={handleRegisterClick}
          disabled={!canRegister || registerMutation.isPending}
          title={!canRegister ? getDisabledReason() : ''}
          sx={{ minWidth: 200 }}
        >
          {isFull && canRegister ? 'Bekleme Listesine Katıl' : 'Kayıt Ol'}
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <EventIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tarih
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {format(eventDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <LocationOnIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Konum
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {event.location}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <PeopleIcon color="action" />
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Katılımcı
                  </Typography>
                  <Typography variant="body2" color={`${capacityColor}.main`} fontWeight="bold">
                    {event.currentParticipants} / {event.capacity} kişi ({capacityPercentage}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(capacityPercentage, 100)}
                  color={capacityColor}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {event.description && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Açıklama
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {event.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Admin: Participants Tab */}
      {isAdmin && (
        <Card sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Detaylar" />
              <Tab label="Katılımcılar" />
              <Tab label="Bekleme Listesi" />
            </Tabs>
          </Box>
          
          {tabValue === 1 && (
            <CardContent>
              {isLoadingParticipants ? (
                <Stack alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography mt={2}>Katılımcılar yükleniyor...</Typography>
                </Stack>
              ) : isErrorParticipants ? (
                <Alert 
                  severity="error"
                  action={
                    <Button size="small" onClick={() => refetchParticipants()}>
                      Tekrar Dene
                    </Button>
                  }
                >
                  Katılımcılar yüklenirken hata oluştu: {participantsError?.response?.data?.message || participantsError?.message || 'Bilinmeyen hata'}
                </Alert>
              ) : participantsData ? (
                participantsData.participants && participantsData.participants.length > 0 ? (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Katılımcılar ({participantsData.participants.length})
                      </Typography>
                    </Stack>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ad Soyad</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Rol</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell>Kayıt Tarihi</TableCell>
                          <TableCell>Giriş Tarihi</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {participantsData.participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell>{participant.user.fullName}</TableCell>
                            <TableCell>{participant.user.email}</TableCell>
                            <TableCell>
                              <Chip 
                                label={participant.user.role === 'student' ? 'Öğrenci' : participant.user.role === 'faculty' ? 'Öğretim Üyesi' : 'Admin'} 
                                size="small" 
                                color={participant.user.role === 'admin' ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  participant.status === 'registered' 
                                    ? 'Kayıtlı' 
                                    : participant.status === 'checked-in' 
                                    ? 'Giriş Yaptı' 
                                    : 'İptal'
                                }
                                size="small"
                                color={
                                  participant.status === 'checked-in' 
                                    ? 'success' 
                                    : participant.status === 'cancelled' 
                                    ? 'error' 
                                    : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {participant.createdAt 
                                ? format(new Date(participant.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {participant.checkInTime 
                                ? format(new Date(participant.checkInTime), 'dd MMM yyyy HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(participant.id)}
                                disabled={removeParticipantMutation.isPending}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Alert severity="info">Bu etkinliğe henüz katılımcı kaydı yok.</Alert>
                )
              ) : null}
            </CardContent>
          )}

          {tabValue === 2 && (
            <CardContent>
              {isLoadingWaitlist ? (
                <Stack alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography mt={2}>Bekleme listesi yükleniyor...</Typography>
                </Stack>
              ) : isErrorWaitlist ? (
                <Alert 
                  severity="error"
                  action={
                    <Button size="small" onClick={() => refetchWaitlist()}>
                      Tekrar Dene
                    </Button>
                  }
                >
                  Bekleme listesi yüklenirken hata oluştu: {waitlistError?.response?.data?.message || waitlistError?.message || 'Bilinmeyen hata'}
                </Alert>
              ) : waitlistData ? (
                waitlistData.waitlist && waitlistData.waitlist.length > 0 ? (
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Bekleme Listesi ({waitlistData.waitlist.length})
                      </Typography>
                      <Alert severity="info" sx={{ py: 0.5, px: 1 }}>
                        Bir katılımcı çıktığında, listedeki ilk kişi otomatik olarak etkinliğe katılacaktır.
                      </Alert>
                    </Stack>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Sıra</TableCell>
                          <TableCell>Ad Soyad</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Rol</TableCell>
                          <TableCell>İstek Tarihi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {waitlistData.waitlist.map((entry, index) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Chip 
                                label={`#${index + 1}`} 
                                size="small" 
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>{entry.user.fullName}</TableCell>
                            <TableCell>{entry.user.email}</TableCell>
                            <TableCell>
                              <Chip 
                                label={entry.user.role === 'student' ? 'Öğrenci' : entry.user.role === 'faculty' ? 'Öğretim Üyesi' : 'Admin'} 
                                size="small" 
                                color={entry.user.role === 'admin' ? 'error' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              {entry.requestDate 
                                ? format(new Date(entry.requestDate), 'dd MMM yyyy HH:mm', { locale: tr })
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Alert severity="info">Bekleme listesinde kimse yok.</Alert>
                )
              ) : null}
            </CardContent>
          )}
        </Card>
      )}

      {/* Registration Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
        <DialogTitle>
          {isFull ? 'Bekleme Listesine Katıl' : 'Etkinliğe Kayıt Ol'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isFull
              ? 'Bu etkinlik için kapasite dolmuş. Bekleme listesine eklenmek istediğinize emin misiniz?'
              : `${event.title} etkinliğine kayıt olmak istediğinize emin misiniz?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleConfirmRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'İşleniyor...' : isFull ? 'Bekleme Listesine Ekle' : 'Kayıt Ol'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Participant Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Katılımcıyı Kaldır</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu katılımcıyı etkinlikten kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={removeParticipantMutation.isPending}
          >
            {removeParticipantMutation.isPending ? 'Kaldırılıyor...' : 'Kaldır'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

