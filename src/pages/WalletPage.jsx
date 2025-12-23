import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Pagination,
    Stack
} from '@mui/material';
import { AccountBalanceWallet, AddCard, History } from '@mui/icons-material';
import { walletService } from '../services/walletService';
import { toast } from 'react-toastify';

const WalletPage = () => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [openAddFunds, setOpenAddFunds] = useState(false);
    const [amount, setAmount] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchWalletData();
        fetchTransactions(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchTransactions(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const fetchWalletData = async () => {
        try {
            const balanceRes = await walletService.getBalance();
            setWallet(balanceRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransactions = async (page) => {
        try {
            const transRes = await walletService.getTransactions(page, itemsPerPage);
            setTransactions(transRes.data.transactions || []);
            setTotalPages(transRes.data.totalPages || 1);
            setTotalTransactions(transRes.data.total || 0);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const handleAddFunds = async () => {
        try {
            const res = await walletService.topup(parseFloat(amount));
            // Redirect to Payment URL (Mock Page)
            // The backend returns absolute URL or something we can construct.
            // Our mock page is internal: /payment-mock
            const paymentUrl = res.data.paymentUrl;

            // Extract the relative path to navigate internally or use window.location if it was real external
            // Since it's internal localhost URL from backend, let's just parse parameters and navigate
            const urlObj = new URL(paymentUrl);
            const relativePath = urlObj.pathname + urlObj.search;

            setOpenAddFunds(false);
            setAmount('');

            // Navigate to mock payment page
            // Assuming we added the route in router.jsx
            window.location.href = relativePath;

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Yükleme başlatılamadı');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Balance Card */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', bgcolor: 'primary.main', color: 'white' }}>
                        <AccountBalanceWallet sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
                        <Typography variant="h6" gutterBottom opacity={0.9}>
                            Mevcut Bakiye
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                            {wallet ? `₺${wallet.balance}` : '...'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddCard />}
                            sx={{ mt: 3, bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f5f5f5' } }}
                            onClick={() => setOpenAddFunds(true)}
                        >
                            Bakiye Yükle
                        </Button>
                    </Paper>
                </Grid>

                {/* Transactions */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, minHeight: 400 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <History sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="h6">
                                İşlem Geçmişi
                            </Typography>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tarih</TableCell>
                                        <TableCell>İşlem</TableCell>
                                        <TableCell>Tutar</TableCell>
                                        <TableCell align="right">Durum</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">İşlem bulunamadı</TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell>
                                                    {new Date(t.createdAt).toLocaleString('tr-TR', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {t.description}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t.type === 'CREDIT' ? 'Yükleme' : 'Harcama'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{
                                                    color: t.type === 'CREDIT' ? 'success.main' : 'error.main',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {t.type === 'CREDIT' ? '+' : '-'}₺{t.amount}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip label="Başarılı" color="success" size="small" variant="outlined" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {/* Pagination */}
                        {totalTransactions > 0 && (
                            <Stack spacing={2} sx={{ mt: 3, alignItems: 'center' }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="large"
                                    showFirstButton
                                    showLastButton
                                />
                                <Typography variant="body2" color="text.secondary">
                                    Toplam {totalTransactions} işlem - Sayfa {currentPage} / {totalPages}
                                </Typography>
                            </Stack>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Add Funds Dialog */}
            <Dialog open={openAddFunds} onClose={() => setOpenAddFunds(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Bakiye Yükle</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            autoFocus
                            label="Tutar (TL)"
                            type="number"
                            fullWidth
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddFunds(false)}>İptal</Button>
                    <Button onClick={handleAddFunds} variant="contained" disabled={!amount || parseFloat(amount) <= 0}>
                        Yükle
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default WalletPage;
