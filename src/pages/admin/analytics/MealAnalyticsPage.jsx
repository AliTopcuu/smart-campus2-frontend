import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Skeleton,
    useTheme,
    Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Download as DownloadIcon,
    Restaurant as RestaurantIcon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as MoneyIcon,
    AccessTime as TimeIcon,
    LocalCafe as CafeIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '@/services/analyticsService';
import { toast } from 'react-toastify';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

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

// Yoğun Saat Kartı
const PeakHourCard = ({ hour, count, maxCount }) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
                sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: percentage > 80 ? 'error.light' : percentage > 50 ? 'warning.light' : 'success.light',
                    fontWeight: 700
                }}
            >
                {hour}:00
            </Box>
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{count} rezervasyon</Typography>
                    <Chip
                        size="small"
                        label={percentage > 80 ? 'Yoğun' : percentage > 50 ? 'Orta' : 'Sakin'}
                        color={percentage > 80 ? 'error' : percentage > 50 ? 'warning' : 'success'}
                    />
                </Box>
                <Box
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            height: '100%',
                            width: `${percentage}%`,
                            borderRadius: 4,
                            bgcolor: percentage > 80 ? 'error.main' : percentage > 50 ? 'warning.main' : 'success.main',
                            transition: 'width 0.5s ease'
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export const MealAnalyticsPage = () => {
    const theme = useTheme();
    const [exportFormat, setExportFormat] = useState('excel');
    const [exporting, setExporting] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['meal-analytics'],
        queryFn: analyticsService.getMealUsageAnalytics
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await analyticsService.exportReport('meal', exportFormat);
            toast.success('Yemek raporu başarıyla indirildi!');
        } catch (error) {
            toast.error('Rapor indirilemedi');
        } finally {
            setExporting(false);
        }
    };

    // Günlük yemek sayıları grafiği
    const dailyMealData = {
        labels: (data?.dailyMealCounts || []).map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }),
        datasets: [{
            label: 'Günlük Yemek Sayısı',
            data: (data?.dailyMealCounts || []).map(d => d.count),
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const lineOptions = {
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
                title: {
                    display: true,
                    text: 'Yemek Sayısı'
                }
            }
        }
    };

    // Yemekhane kullanımı grafiği
    const cafeteriaData = {
        labels: (data?.cafeteriaUtilization || []).map(c => c.cafeteriaName || 'Yemekhane'),
        datasets: [{
            data: (data?.cafeteriaUtilization || []).map(c => c.count),
            backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4'],
            borderWidth: 0
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

    // Öğün dağılımı grafiği
    const mealTypeLabels = {
        breakfast: 'Kahvaltı',
        lunch: 'Öğle',
        dinner: 'Akşam'
    };

    const mealTypeData = {
        labels: (data?.mealTypeUsage || []).map(m => mealTypeLabels[m.mealType] || m.mealType),
        datasets: [{
            label: 'Öğün Dağılımı',
            data: (data?.mealTypeUsage || []).map(m => m.count),
            backgroundColor: ['#ffc107', '#ff9800', '#ff5722'],
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
                beginAtZero: true
            }
        }
    };

    // En yoğun saat
    const maxPeakCount = Math.max(...(data?.peakHours || []).map(p => p.count), 1);

    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Yemek kullanım verileri yüklenirken bir hata oluştu.
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
                        🍽️ Yemek Kullanım Analizi
                    </Typography>
                    <Typography color="text.secondary">
                        Günlük yemek sayıları, yemekhane kullanımı ve yoğun saatler
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
                        sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
                    >
                        Dışa Aktar
                    </Button>
                </Box>
            </Box>

            {/* Özet Metrikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Toplam Yemek"
                        value={(data?.totalMeals || 0).toLocaleString('tr-TR')}
                        icon={RestaurantIcon}
                        color="#ff9800"
                        subtitle={`${data?.usedMeals || 0} kullanıldı`}
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Günlük Ortalama"
                        value={(data?.dailyAverage || 0).toLocaleString('tr-TR')}
                        icon={TrendingUpIcon}
                        color="#2196f3"
                        subtitle="yemek/gün"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Aktif Yemekhane"
                        value={data?.activeCafeterias || data?.cafeteriaUtilization?.length || 0}
                        icon={CafeIcon}
                        color="#9c27b0"
                        subtitle="lokasyon"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Toplam Gelir"
                        value={`₺${(data?.totalRevenue || 0).toLocaleString('tr-TR')}`}
                        icon={MoneyIcon}
                        color="#4caf50"
                        subtitle="Kullanılan yemekler"
                        loading={isLoading}
                    />
                </Grid>
            </Grid>

            {/* Ana Grafikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📈 Günlük Yemek Kullanımı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={300} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Line data={dailyMealData} options={lineOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                🏢 Yemekhane Dağılımı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Doughnut data={cafeteriaData} options={doughnutOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Alt Grafikler */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 350 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                🍳 Öğün Dağılımı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={250} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Bar data={mealTypeData} options={barOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 350 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimeIcon /> Yoğun Saatler
                            </Typography>
                            {isLoading ? (
                                <>
                                    <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                                    <Skeleton variant="rectangular" height={60} />
                                </>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    {(data?.peakHours || []).slice(0, 5).map((peak, index) => (
                                        <PeakHourCard
                                            key={index}
                                            hour={peak.hour}
                                            count={peak.count}
                                            maxCount={maxPeakCount}
                                        />
                                    ))}
                                    {(!data?.peakHours || data.peakHours.length === 0) && (
                                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                            Yoğun saat verisi bulunamadı
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default MealAnalyticsPage;
