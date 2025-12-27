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
    Paper,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Skeleton,
    LinearProgress,
    useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Schedule as ScheduleIcon,
    School as SchoolIcon,
    Person as PersonIcon
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
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

// Yoklama oranı kartı
const AttendanceRateCard = ({ rate, title, subtitle, color }) => {
    return (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`
            }}
        >
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            width: 100,
                            height: 100
                        }}
                    >
                        <CircularProgress
                            variant="determinate"
                            value={rate}
                            size={100}
                            thickness={6}
                            sx={{
                                color: color,
                                '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round'
                                }
                            }}
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
                            <Typography variant="h4" fontWeight={700} sx={{ color }}>
                                {rate}%
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Chip
                            size="small"
                            icon={rate >= 80 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={rate >= 80 ? 'İyi' : rate >= 60 ? 'Orta' : 'Düşük'}
                            sx={{
                                bgcolor: rate >= 80 ? 'success.light' : rate >= 60 ? 'warning.light' : 'error.light',
                                color: rate >= 80 ? 'success.dark' : rate >= 60 ? 'warning.dark' : 'error.dark'
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {subtitle}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export const AttendanceAnalyticsPage = () => {
    const theme = useTheme();
    const [exportFormat, setExportFormat] = useState('excel');
    const [exporting, setExporting] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['attendance-analytics'],
        queryFn: analyticsService.getAttendanceAnalytics
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await analyticsService.exportReport('attendance', exportFormat);
            toast.success('Yoklama raporu başarıyla indirildi!');
        } catch (error) {
            toast.error('Rapor indirilemedi');
        } finally {
            setExporting(false);
        }
    };

    // Son oturumlar grafiği
    const sessionAttendanceData = {
        labels: (data?.recentSessions || []).slice(0, 10).map(s => s.courseCode || 'N/A'),
        datasets: [{
            label: 'Katılım Sayısı',
            data: (data?.recentSessions || []).slice(0, 10).map(s => s.attendanceCount || 0),
            backgroundColor: '#4caf50',
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
                title: {
                    display: true,
                    text: 'Katılım Sayısı'
                }
            }
        }
    };

    // Günlük yoklama trendi
    const trendData = {
        labels: (data?.attendanceTrends || []).map(t => {
            const date = new Date(t.date);
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }),
        datasets: [{
            label: 'Günlük Yoklama',
            data: (data?.attendanceTrends || []).map(t => t.count || 0),
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#2196f3'
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
                    text: 'Yoklama Sayısı'
                }
            }
        }
    };

    // Summary verilerinden istatistikler
    const summary = data?.summary || {};

    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Yoklama analitiği yüklenirken bir hata oluştu.
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
                        ✅ Yoklama Analitiği
                    </Typography>
                    <Typography color="text.secondary">
                        Ders bazlı yoklama oranları, trendler ve devamsızlık raporları
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
                    >
                        Dışa Aktar
                    </Button>
                </Box>
            </Box>

            {/* Özet Kartlar */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196f315 0%, #2196f305 100%)', border: '1px solid #2196f330' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ScheduleIcon sx={{ color: '#2196f3' }} />
                                <Typography variant="subtitle2" color="text.secondary">Toplam Oturum</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#2196f3">
                                    {summary.totalSessions || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf5015 0%, #4caf5005 100%)', border: '1px solid #4caf5030' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                <Typography variant="subtitle2" color="text.secondary">Toplam Katılım</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#4caf50">
                                    {summary.totalAttendance || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff980015 0%, #ff980005 100%)', border: '1px solid #ff980030' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SchoolIcon sx={{ color: '#ff9800' }} />
                                <Typography variant="subtitle2" color="text.secondary">Aktif Oturum</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#ff9800">
                                    {summary.activeSessions || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f4433615 0%, #f4433605 100%)', border: '1px solid #f4433630' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <WarningIcon sx={{ color: '#f44336' }} />
                                <Typography variant="subtitle2" color="text.secondary">Şüpheli Kayıt</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#f44336">
                                    {summary.flaggedRecords || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Grafikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={7}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📊 Son Oturum Katılımları
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={300} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Bar data={sessionAttendanceData} options={barOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📈 Günlük Yoklama Trendi
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={300} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Line data={trendData} options={lineOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Son Oturumlar Tablosu */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon color="primary" /> Son Yoklama Oturumları
                    </Typography>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={300} />
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Ders</TableCell>
                                        <TableCell>Bölüm</TableCell>
                                        <TableCell>Tarih</TableCell>
                                        <TableCell align="right">Katılım</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(data?.recentSessions || []).map((session) => (
                                        <TableRow key={session.id} hover>
                                            <TableCell>{session.courseCode} - {session.courseName || 'N/A'}</TableCell>
                                            <TableCell>{session.sectionNumber || '-'}</TableCell>
                                            <TableCell>{session.date ? new Date(session.date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    size="small"
                                                    label={session.attendanceCount || 0}
                                                    color={session.attendanceCount > 0 ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.recentSessions || data.recentSessions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <Typography color="text.secondary">Henüz oturum verisi yok</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default AttendanceAnalyticsPage;
