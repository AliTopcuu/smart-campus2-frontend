import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Skeleton,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    People as PeopleIcon,
    School as SchoolIcon,
    CheckCircle as CheckCircleIcon,
    Restaurant as RestaurantIcon,
    Event as EventIcon,
    HealthAndSafety as HealthIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '@/services/analyticsService';
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

// Metrik kartı bileşeni
const MetricCard = ({ title, value, icon: Icon, color, trend, loading }) => {
    const theme = useTheme();

    if (loading) {
        return (
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    {trend !== undefined && (
                        <Chip
                            size="small"
                            icon={trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${trend >= 0 ? '+' : ''}${trend}%`}
                            sx={{
                                bgcolor: trend >= 0 ? 'success.light' : 'error.light',
                                color: trend >= 0 ? 'success.dark' : 'error.dark',
                                fontWeight: 600
                            }}
                        />
                    )}
                </Box>
                <Typography variant="h3" sx={{ mt: 2, fontWeight: 700, color: color }}>
                    {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

// Sistem durumu bileşeni
const SystemHealthCard = ({ status, loading }) => {
    const getStatusInfo = (status) => {
        switch (status) {
            case 'healthy':
                return { color: '#4caf50', text: 'Sağlıklı', icon: <HealthIcon /> };
            case 'degraded':
                return { color: '#ff9800', text: 'Düşük Performans', icon: <WarningIcon /> };
            case 'unhealthy':
                return { color: '#f44336', text: 'Sorunlu', icon: <WarningIcon /> };
            default:
                return { color: '#9e9e9e', text: 'Bilinmiyor', icon: <HealthIcon /> };
        }
    };

    const statusInfo = getStatusInfo(status);

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${statusInfo.color}15 0%, ${statusInfo.color}05 100%)`,
                border: `1px solid ${statusInfo.color}30`
            }}
        >
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthIcon /> Sistem Durumu
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: statusInfo.color,
                            color: 'white',
                            animation: status === 'healthy' ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': { boxShadow: `0 0 0 0 ${statusInfo.color}60` },
                                '70%': { boxShadow: `0 0 0 10px ${statusInfo.color}00` },
                                '100%': { boxShadow: `0 0 0 0 ${statusInfo.color}00` }
                            }
                        }}
                    >
                        {statusInfo.icon}
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: statusInfo.color }}>
                            {statusInfo.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Son aktiviteler bileşeni
const RecentActivityCard = ({ activities, loading }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'user': return <PeopleIcon />;
            case 'attendance': return <CheckCircleIcon />;
            case 'meal': return <RestaurantIcon />;
            case 'event': return <EventIcon />;
            case 'grade': return <AssignmentIcon />;
            default: return <ScheduleIcon />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'user': return '#2196f3';
            case 'attendance': return '#4caf50';
            case 'meal': return '#ff9800';
            case 'event': return '#9c27b0';
            case 'grade': return '#00bcd4';
            default: return '#9e9e9e';
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const date = new Date(time);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        return `${diffDays} gün önce`;
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Skeleton variant="text" width="60%" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} variant="rectangular" height={40} sx={{ mt: 1 }} />
                    ))}
                </CardContent>
            </Card>
        );
    }

    const displayActivities = activities || [];

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon /> Son Aktiviteler
                </Typography>
                {displayActivities.length === 0 ? (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        Henüz aktivite yok
                    </Typography>
                ) : (
                    <List dense>
                        {displayActivities.map((activity, index) => (
                            <Box key={index}>
                                <ListItem sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Box
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: `${getActivityColor(activity.type)}20`,
                                                color: getActivityColor(activity.type)
                                            }}
                                        >
                                            {getActivityIcon(activity.type)}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={activity.text}
                                        secondary={formatTime(activity.time)}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                                {index < displayActivities.length - 1 && <Divider />}
                            </Box>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export const AdminDashboardPage = () => {
    const theme = useTheme();

    const { data: dashboardData, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: analyticsService.getDashboardStats,
        refetchInterval: 60000 // Her dakika otomatik yenileme
    });

    // Rol isimlerini Türkçe'ye çevir
    const roleLabels = {
        'student': 'Öğrenci',
        'faculty': 'Öğretim Üyesi',
        'admin': 'Admin',
        'staff': 'Personel'
    };

    const roleColors = {
        'student': '#2196f3',
        'faculty': '#4caf50',
        'admin': '#ff9800',
        'staff': '#9c27b0'
    };

    // Haftalık trend verileri (API'den)
    const getWeeklyLabels = () => {
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
            labels.push(dayNames[date.getDay()]);
        }
        return labels;
    };

    const getWeeklyData = (data, dateField = 'date') => {
        const result = new Array(7).fill(0);
        if (!data) return result;

        data.forEach(item => {
            const itemDate = new Date(item[dateField] || item.date);
            const now = new Date();
            const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                result[6 - diffDays] = item.count || 0;
            }
        });
        return result;
    };

    const weeklyTrendData = {
        labels: getWeeklyLabels(),
        datasets: [
            {
                label: 'Yoklama Sayısı',
                data: getWeeklyData(dashboardData?.weeklyAttendance),
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Yemek Rezervasyonu',
                data: getWeeklyData(dashboardData?.weeklyMeals),
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Yoklama Sayısı'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Yemek Sayısı'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    // Kullanıcı dağılımı (API'den)
    const userDistributionData = {
        labels: (dashboardData?.userDistribution || []).map(u => roleLabels[u.role] || u.role),
        datasets: [{
            data: (dashboardData?.userDistribution || []).map(u => u.count),
            backgroundColor: (dashboardData?.userDistribution || []).map(u => roleColors[u.role] || '#9e9e9e'),
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

    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Dashboard verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        📊 Admin Dashboard
                    </Typography>
                    <Typography color="text.secondary">
                        Kampüs yönetim sisteminin genel görünümü
                    </Typography>
                </Box>
                <Tooltip title="Verileri Yenile">
                    <IconButton onClick={() => refetch()} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Ana Metrikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <MetricCard
                        title="Toplam Kullanıcı"
                        value={dashboardData?.totalUsers || 0}
                        icon={PeopleIcon}
                        color="#2196f3"
                        trend={5.2}
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <MetricCard
                        title="Toplam Ders"
                        value={dashboardData?.totalCourses || 0}
                        icon={SchoolIcon}
                        color="#9c27b0"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <MetricCard
                        title="Yoklama Oranı"
                        value={`%${dashboardData?.attendanceRate || 0}`}
                        icon={CheckCircleIcon}
                        color="#4caf50"
                        trend={2.1}
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <MetricCard
                        title="Bugünkü Yemek"
                        value={dashboardData?.mealReservationsToday || 0}
                        icon={RestaurantIcon}
                        color="#ff9800"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <MetricCard
                        title="Yaklaşan Etkinlik"
                        value={dashboardData?.upcomingEvents || 0}
                        icon={EventIcon}
                        color="#00bcd4"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <SystemHealthCard
                        status={dashboardData?.systemHealth}
                        loading={isLoading}
                    />
                </Grid>
            </Grid>

            {/* Grafikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📈 Haftalık Trendler
                            </Typography>
                            <Box sx={{ height: 'calc(100% - 40px)' }}>
                                <Line data={weeklyTrendData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                👥 Kullanıcı Dağılımı
                            </Typography>
                            <Box sx={{ height: 'calc(100% - 40px)' }}>
                                <Doughnut data={userDistributionData} options={doughnutOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Alt Kartlar */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <RecentActivityCard activities={dashboardData?.recentActivities} loading={isLoading} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                ⚡ Hızlı Erişim
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {[
                                    { title: 'Akademik Analiz', path: '/admin/analytics/academic', color: '#2196f3' },
                                    { title: 'Yoklama Raporu', path: '/admin/analytics/attendance', color: '#4caf50' },
                                    { title: 'Yemek Raporu', path: '/admin/analytics/meal', color: '#ff9800' },
                                    { title: 'Etkinlik Raporu', path: '/admin/analytics/events', color: '#9c27b0' }
                                ].map((item) => (
                                    <Grid item xs={6} key={item.title}>
                                        <Paper
                                            component="a"
                                            href={item.path}
                                            sx={{
                                                p: 2,
                                                display: 'block',
                                                textDecoration: 'none',
                                                textAlign: 'center',
                                                bgcolor: `${item.color}10`,
                                                border: `1px solid ${item.color}30`,
                                                borderRadius: 2,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 12px ${item.color}30`
                                                }
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: item.color, fontWeight: 600 }}>
                                                {item.title}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboardPage;
