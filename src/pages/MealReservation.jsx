import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Container,
    Grid,
    MenuItem,
    TextField,
    Typography,
    Chip,
    Alert,
    Tabs,
    Tab,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Fade
} from '@mui/material';
import { 
    Restaurant as RestaurantIcon, 
    QrCode as QrCodeIcon, 
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
    LocationOn as LocationOnIcon,
    CheckCircle as CheckCircleIcon,
    LocalDining as LocalDiningIcon,
    CalendarToday as CalendarTodayIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { mealService } from '../services/mealService';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import { walletService } from '../services/walletService';

const MealReservation = () => {
    const [tabValue, setTabValue] = useState(0);
    const [cafeterias, setCafeterias] = useState([]);
    const [menus, setMenus] = useState([]);
    const [myReservations, setMyReservations] = useState([]);

    // Filters: Date Range
    const today = new Date().toISOString().split('T')[0];
    const [selectedCafeteria, setSelectedCafeteria] = useState('');
    const [selectedMealType, setSelectedMealType] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    // QR Dialog State
    const [openQrDialog, setOpenQrDialog] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);

    const handleOpenQr = (reservation) => {
        setSelectedReservation(reservation);
        setOpenQrDialog(true);
    };

    const handleCloseQr = () => {
        setOpenQrDialog(false);
        setSelectedReservation(null);
    };

    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm('Bu rezervasyonu iptal etmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await mealService.cancelReservation(reservationId);
            toast.success('Rezervasyon iptal edildi');
            fetchMyReservations();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Rezervasyon iptal edilemedi';
            toast.error(msg);
        }
    };

    const canCancelReservation = (reservation) => {
        if (reservation.status !== 'RESERVED') {
            return false;
        }

        // Check if >= 2 hours before meal start time
        const reservationDate = new Date(reservation.date);
        const mealType = reservation.menu?.mealType || reservation.mealType;
        // Meal start times: LUNCH starts at 12:00, DINNER starts at 18:00
        const mealStartHour = mealType === 'LUNCH' ? 12 : 18;
        const mealStartTime = new Date(reservationDate);
        mealStartTime.setHours(mealStartHour, 0, 0, 0);

        const now = new Date();
        const hoursUntilMealStart = (mealStartTime - now) / (1000 * 60 * 60);

        return hoursUntilMealStart >= 2;
    };

    const [wallet, setWallet] = useState(null);

    useEffect(() => {
        fetchCafeterias();
        fetchMyReservations();
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await walletService.getWallet();
            setWallet(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleReserve = async (menuId) => {
        try {
            await mealService.createReservation({ menuId });
            toast.success('Rezervasyon başarılı!');
            // Update wallet after reservation
            const walletRes = await walletService.getWallet();
            setWallet(walletRes.data);
            fetchMyReservations();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Rezervasyon başarısız';
            toast.error(msg);
        }
    };

    const isReserved = (menuId) => {
        return myReservations.some(r => r.menuId === menuId && r.status === 'RESERVED');
    };

    // Group menus by date
    const groupedMenus = menus.reduce((acc, menu) => {
        if (!acc[menu.date]) {
            acc[menu.date] = [];
        }
        acc[menu.date].push(menu);
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedMenus).sort();

    const fetchMenus = async () => {
        try {
            const res = await mealService.getMenus({
                cafeteriaId: selectedCafeteria,
                startDate: startDate,
                endDate: endDate,
                mealType: selectedMealType || undefined
            });
            // Only show published menus
            setMenus(res.data.filter(m => m.isPublished));
        } catch (error) {
            console.error(error);
            toast.error('Menüler yüklenemedi');
        }
    };

    const fetchMyReservations = async () => {
        try {
            const res = await mealService.getMyReservations();
            setMyReservations(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCafeterias = async () => {
        try {
            const res = await mealService.getCafeterias();
            setCafeterias(res.data);
            if (res.data.length > 0) {
                setSelectedCafeteria(res.data[0].id);
            }
        } catch (error) {
            console.error(error);
            toast.error('Kafeteryalar yüklenemedi');
        }
    };

    useEffect(() => {
        if (selectedCafeteria) {
            fetchMenus();
        }
    }, [selectedCafeteria, startDate, endDate, selectedMealType]);

    // ... inside render ...
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ 
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RestaurantIcon color="primary" sx={{ fontSize: 32 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Yemek Rezervasyonu
                    </Typography>
                </Box>
                {wallet && (
                    <Chip
                        icon={<RestaurantIcon />}
                        label={`Bakiye: ₺${parseFloat(wallet.balance).toFixed(2)}`}
                        color={parseFloat(wallet.balance) < 20 ? "error" : "primary"}
                        variant="outlined"
                        sx={{ 
                            fontSize: '1rem', 
                            py: 1.5, 
                            px: 1,
                            fontWeight: 600
                        }}
                    />
                )}
            </Box>

            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    centered
                    sx={{
                        '& .MuiTab-root': {
                            fontSize: '1rem',
                            fontWeight: 600,
                            py: 2,
                            textTransform: 'none'
                        }
                    }}
                >
                    <Tab icon={<LocalDiningIcon />} iconPosition="start" label="Menüler & Rezervasyon" />
                    <Tab icon={<CalendarTodayIcon />} iconPosition="start" label="Rezervasyonlarım" />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <>
                    {/* Filters */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <FilterListIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Filtreler
                            </Typography>
                        </Box>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    label="Kafeterya Seçin"
                                    value={selectedCafeteria}
                                    onChange={(e) => setSelectedCafeteria(e.target.value)}
                                    fullWidth
                                >
                                    {cafeterias.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <TextField
                                    select
                                    label="Öğün"
                                    value={selectedMealType}
                                    onChange={(e) => setSelectedMealType(e.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="">Tümü</MenuItem>
                                    <MenuItem value="LUNCH">Öğle</MenuItem>
                                    <MenuItem value="DINNER">Akşam</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    type="date"
                                    label="Başlangıç Tarihi"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    type="date"
                                    label="Bitiş Tarihi"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    onClick={fetchMenus}
                                    size="large"
                                >
                                    Menüleri Listele
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Menus List Grouped by Date */}
                    {
                        sortedDates.length === 0 ? (
                            <Alert severity="info">Seçilen tarih aralığında ve kafeterya için yayınlanmış menü bulunamadı.</Alert>
                        ) : (
                            sortedDates.map((date, dateIndex) => (
                                <Box key={date} sx={{ mb: 4 }}>
                                    <Box sx={{
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <CalendarTodayIcon color="primary" />
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                            {new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ mb: 3 }} />
                                    <Grid container spacing={3}>
                                        {groupedMenus[date].map((menu) => (
                                        <Grid item xs={12} md={6} key={menu.id}>
                                            <Fade in={true} timeout={300}>
                                                <Card sx={{ 
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        boxShadow: 4
                                                    },
                                                    border: isReserved(menu.id) ? '2px solid' : 'none',
                                                    borderColor: isReserved(menu.id) ? 'success.main' : 'transparent'
                                                }}>
                                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LocalDiningIcon color="primary" />
                                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                                    {menu.mealType === 'LUNCH' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
                                                                </Typography>
                                                            </Box>
                                                            <Chip 
                                                                label={`${menu.nutritionJson?.calories || 0} kcal`} 
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                        
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <LocationOnIcon fontSize="small" />
                                                            {menu.cafeteria?.name || 'Kafeterya'}
                                                        </Typography>
                                                        
                                                        <Divider sx={{ my: 2 }} />
                                                        
                                                        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                                                            Menü İçeriği:
                                                        </Typography>
                                                        
                                                        <Box component="ul" sx={{ 
                                                            margin: 0, 
                                                            paddingLeft: 2.5,
                                                            '& li': {
                                                                mb: 1,
                                                                color: 'text.primary'
                                                            }
                                                        }}>
                                                            {menu.itemsJson?.map((item, idx) => (
                                                                <li key={idx}>
                                                                    <Typography variant="body1">
                                                                        {item}
                                                                    </Typography>
                                                                </li>
                                                            ))}
                                                        </Box>
                                                    </CardContent>
                                                    
                                                    <CardActions sx={{ p: 2, pt: 0 }}>
                                                        {isReserved(menu.id) ? (
                                                            <Button 
                                                                fullWidth 
                                                                variant="contained" 
                                                                color="success" 
                                                                disabled
                                                                startIcon={<CheckCircleIcon />}
                                                            >
                                                                Rezervasyon Yapıldı
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                fullWidth
                                                                variant="contained"
                                                                onClick={() => handleReserve(menu.id)}
                                                                disabled={new Date(menu.date) < new Date().setHours(0, 0, 0, 0)}
                                                            >
                                                                Rezervasyon Yap
                                                            </Button>
                                                        )}
                                                    </CardActions>
                                                </Card>
                                            </Fade>
                                        </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            ))
                        )
                    }
                </>
            )}

            {
                tabValue === 1 && (
                    <Grid container spacing={3}>
                        {myReservations.length === 0 ? (
                            <Grid item xs={12}>
                                <Alert severity="info">Henüz bir rezervasyonunuz bulunmamaktadır.</Alert>
                            </Grid>
                        ) : (
                            myReservations.map((res) => (
                                <Grid item xs={12} md={4} key={res.id}>
                                    <Fade in={true} timeout={300}>
                                        <Card sx={{ 
                                            height: '100%', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: 4
                                            },
                                            border: res.status === 'RESERVED' ? '2px solid' : 'none',
                                            borderColor: res.status === 'RESERVED' ? 'success.main' : 'transparent'
                                        }}>
                                            <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                                                <LocalDiningIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                    {res.menu?.mealType === 'LUNCH' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
                                                </Typography>
                                                
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                        <CalendarTodayIcon fontSize="small" />
                                                        {new Date(res.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                        <LocationOnIcon fontSize="small" />
                                                        {res.cafeteria?.name}
                                                    </Typography>
                                                </Box>
                                                
                                                <Chip
                                                    label={
                                                        res.status === 'RESERVED' ? 'Aktif' : 
                                                        res.status === 'CANCELLED' ? 'İptal Edildi' : 
                                                        'Kullanıldı'
                                                    }
                                                    color={
                                                        res.status === 'RESERVED' ? 'success' : 
                                                        res.status === 'CANCELLED' ? 'error' : 
                                                        'default'
                                                    }
                                                    sx={{ 
                                                        mt: 1,
                                                        mb: 2,
                                                        fontWeight: 600
                                                    }}
                                                />
                                                
                                                <Stack spacing={1.5} sx={{ width: '100%', mt: 3 }}>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<QrCodeIcon />}
                                                        onClick={() => handleOpenQr(res)}
                                                        fullWidth
                                                    >
                                                        QR Kodu Göster
                                                    </Button>
                                                    {canCancelReservation(res) && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => handleCancelReservation(res.id)}
                                                            fullWidth
                                                        >
                                                            Rezervasyonu İptal Et
                                                        </Button>
                                                    )}
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Fade>
                                </Grid>
                            ))
                        )}

                    </Grid>
                )
            }

            {/* QR Code Dialog */}
            <Dialog 
                open={openQrDialog} 
                onClose={handleCloseQr} 
                maxWidth="xs" 
                fullWidth
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                    <QrCodeIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Yemek Teslim Kodu
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    {selectedReservation && (
                        <>
                            <Box sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.50',
                                mb: 2
                            }}>
                                <QRCodeSVG value={selectedReservation.qrCode} size={250} />
                            </Box>
                            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                                {selectedReservation.menu?.mealType === 'LUNCH' ? 'Öğle Yemeği' : 'Akşam Yemeği'}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarTodayIcon fontSize="small" />
                                {new Date(selectedReservation.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                            <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center', display: 'block' }}>
                                Bu kodu yemekhane görevlisine okutunuz.
                            </Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                        onClick={handleCloseQr}
                        variant="contained"
                        fullWidth
                    >
                        Kapat
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MealReservation;
