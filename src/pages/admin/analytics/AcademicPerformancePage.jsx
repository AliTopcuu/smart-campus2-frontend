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
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon,
    Star as StarIcon,
    EmojiEvents as TrophyIcon
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

// GPA Kartı
const GPACard = ({ department, gpa, loading }) => {
    const getGPAColor = (gpa) => {
        if (gpa >= 3.5) return '#4caf50';
        if (gpa >= 3.0) return '#8bc34a';
        if (gpa >= 2.5) return '#ffc107';
        if (gpa >= 2.0) return '#ff9800';
        return '#f44336';
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
            </Card>
        );
    }

    const color = getGPAColor(gpa);

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
                    {department}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            width: 80,
                            height: 80
                        }}
                    >
                        <CircularProgress
                            variant="determinate"
                            value={(gpa / 4) * 100}
                            size={80}
                            thickness={4}
                            sx={{ color: color }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="h6" fontWeight={700} sx={{ color }}>
                                {gpa.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Ortalama GPA
                        </Typography>
                        <Chip
                            size="small"
                            icon={gpa >= 3.0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={gpa >= 3.0 ? 'İyi' : 'Geliştirilmeli'}
                            sx={{
                                mt: 0.5,
                                bgcolor: gpa >= 3.0 ? 'success.light' : 'warning.light',
                                color: gpa >= 3.0 ? 'success.dark' : 'warning.dark'
                            }}
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Öğrenci Tablosu
const StudentTable = ({ students, title, icon: Icon, color, isTopPerformer }) => {
    if (!students || students.length === 0) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon sx={{ color }} /> {title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        Veri bulunamadı
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon sx={{ color }} /> {title}
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Öğrenci</TableCell>
                                <TableCell>Numara</TableCell>
                                <TableCell align="right">GPA</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student, index) => (
                                <TableRow key={student.id} hover>
                                    <TableCell>
                                        {isTopPerformer && index < 3 ? (
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                                                    color: 'white',
                                                    fontSize: 12,
                                                    fontWeight: 700
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                        ) : (
                                            index + 1
                                        )}
                                    </TableCell>
                                    <TableCell>{student.fullName || '-'}</TableCell>
                                    <TableCell>{student.studentNumber || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            size="small"
                                            label={student.gpa || '0.00'}
                                            color={parseFloat(student.gpa) >= 2.0 ? 'success' : 'error'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export const AcademicPerformancePage = () => {
    const theme = useTheme();
    const [exportFormat, setExportFormat] = useState('excel');
    const [exporting, setExporting] = useState(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['academic-performance'],
        queryFn: analyticsService.getAcademicPerformance
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await analyticsService.exportReport('academic', exportFormat);
            toast.success('Rapor başarıyla indirildi!');
        } catch (error) {
            toast.error('Rapor indirilemedi');
        } finally {
            setExporting(false);
        }
    };

    // Not dağılımı grafiği
    const gradeDistributionData = {
        labels: ['A', 'B', 'C', 'D', 'F'],
        datasets: [{
            label: 'Not Dağılımı (%)',
            data: data?.gradeDistribution ? [
                data.gradeDistribution.A || 0,
                data.gradeDistribution.B || 0,
                data.gradeDistribution.C || 0,
                data.gradeDistribution.D || 0,
                data.gradeDistribution.F || 0
            ] : [0, 0, 0, 0, 0],
            backgroundColor: ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'],
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
                    text: 'Yüzde (%)'
                }
            }
        }
    };

    // Geçme/Kalma oranı
    const passFailData = {
        labels: ['Geçen', 'Kalan'],
        datasets: [{
            data: [data?.passFailRate?.passRate || 0, data?.passFailRate?.failRate || 0],
            backgroundColor: ['#4caf50', '#f44336'],
            borderWidth: 0
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        },
        cutout: '70%'
    };

    if (isError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Akademik performans verileri yüklenirken bir hata oluştu.
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
                        📚 Akademik Performans Analizi
                    </Typography>
                    <Typography color="text.secondary">
                        Bölüm bazlı GPA, not dağılımı ve öğrenci performansları
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
                                <SchoolIcon sx={{ color: '#2196f3' }} />
                                <Typography variant="subtitle2" color="text.secondary">Toplam Kayıt</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#2196f3">
                                    {data?.summary?.totalEnrollments || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf5015 0%, #4caf5005 100%)', border: '1px solid #4caf5030' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <TrendingUpIcon sx={{ color: '#4caf50' }} />
                                <Typography variant="subtitle2" color="text.secondary">Tamamlanan</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#4caf50">
                                    {data?.summary?.completedEnrollments || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ff980015 0%, #ff980005 100%)', border: '1px solid #ff980030' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <StarIcon sx={{ color: '#ff9800' }} />
                                <Typography variant="subtitle2" color="text.secondary">Ortalama GPA</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#ff9800">
                                    {data?.summary?.avgGpa?.toFixed(2) || '0.00'}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9c27b015 0%, #9c27b005 100%)', border: '1px solid #9c27b030' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <TrophyIcon sx={{ color: '#9c27b0' }} />
                                <Typography variant="subtitle2" color="text.secondary">Toplam Not</Typography>
                            </Box>
                            {isLoading ? (
                                <Skeleton variant="text" width="60%" height={50} />
                            ) : (
                                <Typography variant="h3" fontWeight={700} color="#9c27b0">
                                    {data?.summary?.totalGrades || 0}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Grafikler */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 350 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                📊 Not Dağılımı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="rectangular" height={250} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)' }}>
                                    <Bar data={gradeDistributionData} options={barOptions} />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 350 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                ✅ Geçme/Kalma Oranı
                            </Typography>
                            {isLoading ? (
                                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 2 }} />
                            ) : (
                                <Box sx={{ height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', height: '80%' }}>
                                        <Doughnut data={passFailData} options={doughnutOptions} />
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" fontWeight={700} color="success.main">
                                                %{data?.passFailRate?.passRate || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Geçen</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" fontWeight={700} color="error.main">
                                                %{data?.passFailRate?.failRate || 0}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Kalan</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Öğrenci Tabloları */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    {isLoading ? (
                        <Card>
                            <CardContent>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    ) : (
                        <StudentTable
                            students={data?.topStudents}
                            title="En Başarılı Öğrenciler"
                            icon={TrophyIcon}
                            color="#ffc107"
                            isTopPerformer={true}
                        />
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    {isLoading ? (
                        <Card>
                            <CardContent>
                                <Skeleton variant="text" width="60%" />
                                <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
                            </CardContent>
                        </Card>
                    ) : (
                        <StudentTable
                            students={data?.atRiskStudents}
                            title="Risk Altındaki Öğrenciler"
                            icon={WarningIcon}
                            color="#f44336"
                            isTopPerformer={false}
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default AcademicPerformancePage;
