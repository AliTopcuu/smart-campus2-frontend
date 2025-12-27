import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import { eventService } from '@/services/eventService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const EventListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') ?? '';
  const statusQuery = searchParams.get('status') ?? '';
  const dateFilterQuery = searchParams.get('dateFilter') ?? '';

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusQuery);
  const [localDateFilter, setLocalDateFilter] = useState(dateFilterQuery);

  const queryParams = useMemo(
    () => {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (statusQuery) params.status = statusQuery;
      if (dateFilterQuery) params.dateFilter = dateFilterQuery;
      return params;
    },
    [searchQuery, statusQuery, dateFilterQuery]
  );

  const { data: events = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['events', queryParams],
    queryFn: () => eventService.list(queryParams),
    keepPreviousData: true,
  });

  const handleFilterSubmit = () => {
    const nextParams = new URLSearchParams();
    if (localSearch.trim()) nextParams.set('search', localSearch.trim());
    if (localStatus) nextParams.set('status', localStatus);
    if (localDateFilter) nextParams.set('dateFilter', localDateFilter);
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setLocalSearch('');
    setLocalStatus('');
    setLocalDateFilter('');
    setSearchParams({});
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Etkinlikler yükleniyor...</Typography>
        </Stack>
      );
    }

    if (isError) {
      return (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
        >
          Etkinlikler alınırken bir hata oluştu. Lütfen tekrar deneyin.
        </Alert>
      );
    }

    if (events.length === 0) {
      return <Alert severity="info">Filtrelere uygun etkinlik bulunamadı.</Alert>;
    }

    return (
      <Grid container spacing={2}>
        {events.map((event) => {
          const capacityPercentage = getCapacityPercentage(event.currentParticipants, event.capacity);
          const capacityColor = getCapacityColor(capacityPercentage);
          const eventDate = new Date(event.date);
          const isFull = event.currentParticipants >= event.capacity;

          // computedStatus veya manuel hesaplama
          const getEventStatus = () => {
            if (event.computedStatus) return event.computedStatus;
            if (event.status === 'cancelled') return 'cancelled';
            const now = new Date();
            if (event.endDate && new Date(event.endDate) < now) return 'completed';
            if (new Date(event.date) > now) return 'upcoming';
            return 'active';
          };

          const eventStatus = getEventStatus();

          const statusConfig = {
            upcoming: { label: 'Yaklaşan', color: 'info' },
            active: { label: 'Aktif', color: 'success' },
            completed: { label: 'Bitti', color: 'default' },
            cancelled: { label: 'İptal', color: 'error' }
          };

          const currentStatus = statusConfig[eventStatus] || statusConfig.active;

          return (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
                    <Chip
                      label={currentStatus.label}
                      color={currentStatus.color}
                      size="small"
                    />
                    {isFull && eventStatus !== 'completed' && (
                      <Chip label="Dolu" color="warning" size="small" variant="outlined" />
                    )}
                  </Stack>

                  <Typography variant="h6" mt={1} mb={1}>
                    {event.title}
                  </Typography>

                  <Stack spacing={1} mb={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {format(eventDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {event.currentParticipants} / {event.capacity} kişi
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box mb={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Doluluk Oranı
                      </Typography>
                      <Typography variant="caption" color={`${capacityColor}.main`} fontWeight="bold">
                        {capacityPercentage}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(capacityPercentage, 100)}
                      color={capacityColor}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button
                    component={Link}
                    to={`/events/${event.id}`}
                    variant="outlined"
                    size="small"
                  >
                    Detay
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Etkinlikler
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Etkinlik adı"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Durum"
              value={localStatus}
              onChange={(e) => setLocalStatus(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="active">Aktif</MenuItem>
              <MenuItem value="cancelled">İptal</MenuItem>
              <MenuItem value="completed">Tamamlandı</MenuItem>
            </TextField>
            <TextField
              select
              label="Tarih"
              value={localDateFilter}
              onChange={(e) => setLocalDateFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="upcoming">Yaklaşan</MenuItem>
              <MenuItem value="past">Geçmiş</MenuItem>
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleFilterSubmit}
                disabled={isFetching}
              >
                Filtrele
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleResetFilters}
              >
                Sıfırla
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      {renderContent()}
    </Box>
  );
};

