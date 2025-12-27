import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Skeleton,
    useTheme,
    Chip,
    LinearProgress,
    Avatar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Download as DownloadIcon,
    Event as EventIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Category as CategoryIcon,
    Star as StarIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '@/services/analyticsService';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    ChartTooltip,
    Legend
);

// Kategori renkleri - geniş palet
const categoryColors = {
    'academic': '#2196f3',
    'social': '#4caf50',
    'sports': '#ff9800',
    'cultural': '#9c27b0',
    'career': '#00bcd4',
    'workshop': '#f44336',
    'seminar': '#3f51b5',
    'conference': '#795548',
    'seminer': '#3f51b5',
    'konferans': '#795548',
    'genel': '#607d8b',
    'other': '#9e9e9e'
};

// Dinamik renk paleti (bilinmeyen kategoriler için)
const colorPalette = [
    '#e91e63', '#673ab7', '#03a9f4', '#009688', '#8bc34a',
    '#ffeb3b', '#ff5722', '#607d8b', '#795548', '#9c27b0',
    '#2196f3', '#4caf50', '#ff9800', '#f44336', '#00bcd4'
];

// Kategori için renk almak
const getCategoryColor = (category, index = 0) => {
    if (!category) return '#607d8b';
    const key = category.toLowerCase();
    if (categoryColors[key]) return categoryColors[key];
    // Bilinmeyen kategoriler için palet'ten renk seç
    return colorPalette[index % colorPalette.length];
};

// Metrik Kartı
const MetricCard = ({ title, value, icon: Icon, color, subtitle, loading }) => {
    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton variant="text" sx={{ mt: 2 }} />
                    <Skeleton variant="text" width="60%" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${color}25`
                }
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
                        boxShadow: `0 4px 12px ${color}40`
                    }}
                >
                    <Icon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h3" sx={{ mt: 2, fontWeight: 700, color: color }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.disabled">
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

// Popüler Etkinlik Kartı
const PopularEventCard = ({ event, rank }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: 2
                }
            }}
        >
            <Avatar
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: rank <= 3 ? (rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32') : 'grey.300',
                    color: rank <= 3 ? 'white' : 'text.secondary',
                    fontWeight: 700
                }}
            >
                {rank}
            </Avatar>
            <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    {event.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                        size="small"
                        label={event.category || 'Genel'}
                        sx={{
                            bgcolor: `${getCategoryColor(event.category)}20`,
                            color: getCategoryColor(event.category),
                            fontSize: 11
                        }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {new Date(event.startDate).toLocaleDateString('tr-TR')}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" fontWeight={700} color="primary">
                    {event.capacity}
                </Typography>
                <Typography variant="caption" color="text.secondary">kapasite</Typography>
            </Box>
        </Box>
    );
};

export const EventAnalyticsPage = () => {
    const theme = useTheme();
    const [exportFormat, setExportFormat] = useState('excel');
    const [exporting, setExporting] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['event-analytics'],
        queryFn: analyticsService.getEventAnalytics
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await analyticsService.exportReport('event', exportFormat);
            toast.success('Etkinlik raporu başarıyla indirildi!');
        } catch (error) {
            toast.error('Rapor indirilemedi');
        } finally {
            setExporting(false);
        }
    };

    // Kategori dağılımı grafiği
    const categoryData = {
        labels: (data?.categoryBreakdown || []).map(c => {
            const cat = c.category || 'Genel';
            // Kategori adını Türkçeleştir
            const categoryLabels = {
                'academic': 'Akademik',
                'social': 'Sosyal',
                'sports': 'Spor',
                'cultural': 'Kültürel',
                'career': 'Kariyer',
                'workshop': 'Workshop',
                'seminar': 'Seminer',
                'conference': 'Konferans',
                'genel': 'Genel'
            };
            return categoryLabels[cat.toLowerCase()] || cat;
        }),
        datasets: [{
            data: (data?.categoryBreakdown || []).map(c => c.count),
            backgroundColor: (data?.categoryBreakdown || []).map((c, index) =>
                getCategoryColor(c.category, index)
            ),
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right'
            }
        },
        cutout: '60%'
    };

    // Kayıt oranları grafiği
    const registrationData = {
        labels: (data?.registrationRates || []).slice(0, 8).map(r =>
            r.eventTitle?.substring(0, 15) + (r.eventTitle?.length > 15 ? '...' : '') || 'Etkinlik'
        ),
        datasets: [{
            label: 'Kayıt Oranı (%)',
            data: (data?.registrationRates || []).slice(0, 8).map(r => r.rate),
            backgroundColor: (data?.registrationRates || []).slice(0, 8).map(r =>
                r.rate >= 80 ? '#4caf50' : r.rate >= 50 ? '#ff9800' : '#f44336'
            ),
            borderRadius: 8
        }]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Kayıt Oranı (%)'
                }
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Etkinlik verileri yüklenirken bir hata oluştu.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        🎉 Etkinlik Analitiği
                    </Typography>
                    <Typography color="text.secondary">
                        Popüler etkinlikler, kayıt oranları ve kategori dağılımı
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Format</InputLabel>
                        <Select
                            value={exportFormat}
                            label="Format"
                            onChange={(e) => setExportFormat(e.target.value)}
                        >
                            <MenuItem value="excel">Excel</MenuItem>
                            <MenuItem value="csv">CSV</MenuItem>
                            <MenuItem value="pdf">PDF</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting || isLoading}
                        sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
                    >
                        Dışa Aktar
                    </Button>
                </Box>
            </Box>

            {/* Özet Metrikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Toplam Etkinlik"
                        value={(data?.categoryBreakdown || []).reduce((sum, c) => sum + c.count, 0)}
                        icon={EventIcon}
                        color="#9c27b0"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Toplam Kayıt"
                        value={data?.checkInStats?.totalRegistrations || 0}
                        icon={PeopleIcon}
                        color="#2196f3"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Check-in Yapan"
                        value={data?.checkInStats?.checkedIn || 0}
                        icon={CheckCircleIcon}
                        color="#4caf50"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    {isLoading ? (
                        <MetricCard loading={true} />
                    ) : (
                        <Card
                            sx={{
                                height: '100%',
                                background: `linear-gradient(135deg, #ff980015 0%, #ff980005 100%)`,
                                border: `1px solid #ff980030`
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <TrendingUpIcon sx={{ color: '#ff9800' }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Check-in Oranı
                                    </Typography>
                                </Box>
                                <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={data?.checkInStats?.checkInRate || 0}
                                        size={80}
                                        thickness={6}
                                        sx={{ color: '#ff9800' }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h5" fontWeight={700} color="#ff9800">
                                            %{data?.checkInStats?.checkInRate || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Grafikler ve Listeler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📊 Etkinlik Kayıt Oranları
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={300} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Bar data={registrationData} options={barOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                🏷️ Kategori Dağılımı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Doughnut data={categoryData} options={doughnutOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Popüler Etkinlikler ve Kayıt Tablosu */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StarIcon sx={{ color: '#ffc107' }} /> En Popüler Etkinlikler
                            </Typography>
                            {isLoading ? (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 2 }} />
                                    ))}
                                </>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                                    {(data?.popularEvents || []).slice(0, 5).map((event, index) => (
                                        <PopularEventCard key={event.id} event={event} rank={index + 1} />
                                    ))}
                                    {(!data?.popularEvents || data.popularEvents.length === 0) && (
                                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                            Etkinlik verisi bulunamadı
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PeopleIcon color="primary" /> Etkinlik Kayıt Detayları
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={300} />
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Etkinlik</TableCell>
                                                <TableCell align="center">Kapasite</TableCell>
                                                <TableCell align="center">Kayıt</TableCell>
                                                <TableCell align="right">Doluluk</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {(data?.registrationRates || []).slice(0, 8).map((event, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                            {event.eventTitle}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">{event.capacity}</TableCell>
                                                    <TableCell align="center">{event.registrations}</TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={event.rate}
                                                                sx={{
                                                                    width: 50,
                                                                    height: 6,
                                                                    borderRadius: 3,
                                                                    bgcolor: 'grey.200',
                                                                    '& .MuiLinearProgress-bar': {
                                                                        bgcolor: event.rate >= 80 ? 'success.main' : event.rate >= 50 ? 'warning.main' : 'error.main'
                                                                    }
                                                                }}
                                                            />
                                                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 35 }}>
                                                                %{event.rate}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!data?.registrationRates || data.registrationRates.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center">
                                                        <Typography color="text.secondary">Veri bulunamadı</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EventAnalyticsPage;
