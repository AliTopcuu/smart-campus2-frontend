import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    TextField,
    Grid
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, CreditCard } from '@mui/icons-material';
import { walletService } from '../services/walletService';
import { toast } from 'react-toastify';

const PaymentMockPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');
    const amount = query.get('amount');

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('pending'); // pending, success, error

    // Mock form state
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        // Simulate network delay
        setTimeout(async () => {
            try {
                // Call webhook to finalize
                await walletService.completePayment({
                    sessionId: sessionId,
                    status: 'success',
                    amount: parseFloat(amount),
                    // In real world, userId is inferred from auth token or metadata. 
                    // Our backend endpoint requires authentication, so that's handled.
                });

                setStatus('success');
                toast.success('Ödeme başarılı!');

                // Redirect after 2 seconds
                setTimeout(() => {
                    navigate('/wallet', { replace: true });
                }, 2000);

            } catch (error) {
                console.error(error);
                setStatus('error');
                toast.error('Ödeme işlemi sırasında bir hata oluştu');
            } finally {
                setLoading(false);
            }
        }, 1500);
    };

    if (!sessionId || !amount) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h5">Geçersiz Ödeme Oturumu</Typography>
                    <Button onClick={() => navigate('/wallet')} sx={{ mt: 2 }}>Cüzdana Dön</Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                {status === 'pending' && (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <CreditCard color="primary" sx={{ fontSize: 40, mr: 2 }} />
                            <Typography variant="h5">Güvenli Ödeme</Typography>
                        </Box>

                        <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Ödenecek Tutar</Typography>
                            <Typography variant="h4" fontWeight="bold">₺{amount}</Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Kart Numarası"
                                    fullWidth
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="0000 0000 0000 0000"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="Son Kullanma (AA/YY)"
                                    fullWidth
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="CVV"
                                    fullWidth
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    type="password"
                                    placeholder="123"
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 4 }}
                            onClick={handlePayment}
                            disabled={loading || !cardNumber || !expiry || !cvv}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : `Ödemeyi Tamamla (₺${amount})`}
                        </Button>
                        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
                            Bu bir simülasyon ekranıdır. Gerçek kart bilgilerinizi girmeyiniz.
                        </Typography>
                    </>
                )}

                {status === 'success' && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
                        <Typography variant="h4" gutterBottom>Ödeme Başarılı!</Typography>
                        <Typography color="text.secondary">Cüzdanınıza yönlendiriliyorsunuz...</Typography>
                    </Box>
                )}

                {status === 'error' && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
                        <Typography variant="h4" gutterBottom>Ödeme Başarısız</Typography>
                        <Button onClick={() => setStatus('pending')} variant="outlined" sx={{ mt: 2 }}>Tekrar Dene</Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default PaymentMockPage;
