import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import { eventService } from '@/services/eventService';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const MyTicketsPage = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const { data: registrations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => eventService.myRegistrations(),
  });

  const handleOpenQr = (registration) => {
    setSelectedTicket(registration);
    setQrDialogOpen(true);
  };

  const handleCloseQr = () => {
    setQrDialogOpen(false);
    setSelectedTicket(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered':
        return 'success';
      case 'checked-in':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'registered':
        return 'Aktif';
      case 'checked-in':
        return 'Giriş Yapıldı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Etkinlikleriniz yükleniyor...</Typography>
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
        >
          Etkinlikler alınırken bir hata oluştu.
        </Alert>
      </Container>
    );
  }

  if (registrations.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" mb={3}>
          Etkinliklerim
        </Typography>
        <Alert severity="info">
          Henüz kayıt olduğunuz bir etkinlik bulunmamaktadır.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" mb={3}>
        Etkinliklerim
      </Typography>

      <Grid container spacing={3}>
        {registrations.map((registration) => {
          const event = registration.event;
          const eventDate = event ? new Date(event.date) : null;

          return (
            <Grid item xs={12} md={4} key={registration.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                  {event ? (
                    <>
                      <Typography variant="h6" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {eventDate ? format(eventDate, 'dd MMMM yyyy, EEEE', { locale: tr }) : 'Tarih belirtilmemiş'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {event.location}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Etkinlik bilgisi yüklenemedi
                    </Typography>
                  )}

                  <Chip
                    label={getStatusLabel(registration.status)}
                    color={getStatusColor(registration.status)}
                    sx={{ mt: 2, mb: 2 }}
                  />

                  {registration.checkInTime && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Giriş: {format(new Date(registration.checkInTime), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                    </Typography>
                  )}

                  <Stack spacing={1} sx={{ width: '100%', mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      onClick={() => handleOpenQr(registration)}
                      disabled={registration.status === 'cancelled'}
                      fullWidth
                    >
                      QR Kodu Göster
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={handleCloseQr}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Etkinlik Giriş Kodu
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          {selectedTicket && (
            <>
              {selectedTicket.event && (
                <>
                  <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    {selectedTicket.event.title}
                  </Typography>
                  {selectedTicket.event.date && (
                    <Typography variant="body1" color="text.secondary" mb={2}>
                      {format(new Date(selectedTicket.event.date), 'dd MMMM yyyy', { locale: tr })}
                    </Typography>
                  )}
                </>
              )}
              <QRCodeSVG
                value={selectedTicket.qrCodeData || selectedTicket.qrCode}
                size={250}
                level="H"
                includeMargin={true}
              />
              <Typography variant="caption" sx={{ mt: 3, color: 'text.secondary', textAlign: 'center' }}>
                Bu kodu etkinlik girişinde görevliye gösteriniz.
              </Typography>
              <Chip
                label={getStatusLabel(selectedTicket.status)}
                color={getStatusColor(selectedTicket.status)}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQr}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

