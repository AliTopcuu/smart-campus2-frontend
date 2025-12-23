import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
    Chip,
    Stack,
    FormControlLabel,
    Switch
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { mealService } from '../../services/mealService';
import { toast } from 'react-toastify';

const MealManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const [cafeterias, setCafeterias] = useState([]);
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(false);

    // Dialog States
    const [openMenuDialog, setOpenMenuDialog] = useState(false);
    const [openCafeteriaDialog, setOpenCafeteriaDialog] = useState(false);

    // Form States
    const [currentMenu, setCurrentMenu] = useState({
        cafeteriaId: '',
        date: '',
        mealType: 'LUNCH',
        items: '',
        calories: '',
        isPublished: true
    });
    const [currentCafeteria, setCurrentCafeteria] = useState({ name: '', location: '', capacity: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCafeterias();
        fetchMenus();
    }, []);

    const fetchCafeterias = async () => {
        try {
            const res = await mealService.getCafeterias();
            setCafeterias(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch cafeterias');
        }
    };

    const fetchMenus = async () => {
        try {
            const res = await mealService.getMenus();
            setMenus(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch menus');
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleSaveCafeteria = async () => {
        try {
            await mealService.createCafeteria(currentCafeteria);
            toast.success('Cafeteria created');
            setOpenCafeteriaDialog(false);
            fetchCafeterias();
        } catch (error) {
            toast.error('Error creating cafeteria');
        }
    };

    const handleDeleteCafeteria = async (id) => {
        if (window.confirm('Are you sure you want to delete this cafeteria?')) {
            try {
                await mealService.deleteCafeteria(id);
                toast.success('Cafeteria deleted');
                fetchCafeterias();
            } catch (error) {
                console.error(error);
                const msg = error.response?.data?.message || 'Error deleting cafeteria';
                toast.error(msg);
            }
        }
    };

    const handleSaveMenu = async () => {
        try {
            if (!currentMenu.cafeteriaId) {
                toast.error('Please select a cafeteria');
                return;
            }

            const itemsJson = currentMenu.items.split('\n').filter(i => i.trim());
            const nutritionJson = { calories: parseInt(currentMenu.calories) || 0 };

            const payload = {
                ...currentMenu,
                itemsJson,
                nutritionJson
            };

            if (isEditing) {
                await mealService.updateMenu(currentMenu.id, payload);
                toast.success('Menu updated');
            } else {
                await mealService.createMenu(payload);
                toast.success('Menu created');
            }
            setOpenMenuDialog(false);
            fetchMenus();
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Error saving menu';
            toast.error(message);
        }
    };

    const handleDeleteMenu = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu?')) {
            try {
                await mealService.deleteMenu(id);
                toast.success('Menu deleted');
                fetchMenus();
            } catch (error) {
                console.error(error);
                const msg = error.response?.data?.message || 'Error deleting menu';
                toast.error(msg);
            }
        }
    };

    const openMenuForm = (menu = null) => {
        if (menu) {
            setIsEditing(true);
            setCurrentMenu({
                id: menu.id,
                cafeteriaId: menu.cafeteriaId,
                date: menu.date,
                mealType: menu.mealType,
                items: menu.itemsJson ? menu.itemsJson.join('\n') : '',
                calories: menu.nutritionJson?.calories || '',
                isPublished: menu.isPublished
            });
        } else {
            setIsEditing(false);
            setCurrentMenu({
                cafeteriaId: cafeterias[0]?.id || '',
                date: new Date().toISOString().split('T')[0],
                mealType: 'LUNCH',
                items: '',
                calories: '',
                isPublished: true
            });
        }
        setOpenMenuDialog(true);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom component="div" sx={{ mb: 3 }}>
                Yemek Yönetimi
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Menüler" />
                    <Tab label="Kafeteryalar" />
                </Tabs>

                {/* Menus Tab */}
                <Box sx={{ p: 3 }} role="tabpanel" hidden={tabValue !== 0}>
                    {tabValue === 0 && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMenuForm()}>
                                    Menü Ekle
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tarih</TableCell>
                                            <TableCell>Öğün</TableCell>
                                            <TableCell>Kafeterya</TableCell>
                                            <TableCell>İçerik</TableCell>
                                            <TableCell>Kalori</TableCell>
                                            <TableCell>Durum</TableCell>
                                            <TableCell>İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {menus.map((menu) => (
                                            <TableRow key={menu.id}>
                                                <TableCell>{menu.date}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={menu.mealType === 'LUNCH' ? 'Öğle' : 'Akşam'}
                                                        color={menu.mealType === 'LUNCH' ? 'warning' : 'info'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{menu.cafeteria?.name}</TableCell>
                                                <TableCell>
                                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                        {menu.itemsJson?.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </TableCell>
                                                <TableCell>{menu.nutritionJson?.calories} kcal</TableCell>
                                                <TableCell>
                                                    {menu.isPublished ? (
                                                        <Chip label="Yayında" color="success" size="small" variant="outlined" />
                                                    ) : (
                                                        <Chip label="Taslak" color="default" size="small" variant="outlined" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton color="primary" onClick={() => openMenuForm(menu)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="error" onClick={() => handleDeleteMenu(menu.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {menus.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">No menus found</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>

                {/* Cafeterias Tab */}
                <Box sx={{ p: 3 }} role="tabpanel" hidden={tabValue !== 1}>
                    {tabValue === 1 && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCafeteriaDialog(true)}>
                                    Kafeterya Ekle
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>İsim</TableCell>
                                            <TableCell>Konum</TableCell>
                                            <TableCell>Kapasite</TableCell>
                                            <TableCell>İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cafeterias.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell>{c.name}</TableCell>
                                                <TableCell>{c.location}</TableCell>
                                                <TableCell>{c.capacity}</TableCell>
                                                <TableCell>
                                                    <IconButton color="error" onClick={() => handleDeleteCafeteria(c.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </Box>
            </Paper>

            {/* Menu Dialog */}
            <Dialog open={openMenuDialog} onClose={() => setOpenMenuDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Menü Düzenle' : 'Menü Oluştur'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            select
                            label="Kafeterya"
                            value={currentMenu.cafeteriaId}
                            onChange={(e) => setCurrentMenu({ ...currentMenu, cafeteriaId: e.target.value })}
                            fullWidth
                        >
                            {cafeterias.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            type="date"
                            label="Tarih"
                            InputLabelProps={{ shrink: true }}
                            value={currentMenu.date}
                            onChange={(e) => setCurrentMenu({ ...currentMenu, date: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Öğün Türü"
                            value={currentMenu.mealType}
                            onChange={(e) => setCurrentMenu({ ...currentMenu, mealType: e.target.value })}
                            fullWidth
                        >
                            <MenuItem value="LUNCH">Öğle Yemeği</MenuItem>
                            <MenuItem value="DINNER">Akşam Yemeği</MenuItem>
                        </TextField>
                        <TextField
                            multiline
                            rows={4}
                            label="Menü İçeriği (Her satıra bir tane)"
                            value={currentMenu.items}
                            onChange={(e) => setCurrentMenu({ ...currentMenu, items: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            type="number"
                            label="Kalori"
                            value={currentMenu.calories}
                            onChange={(e) => setCurrentMenu({ ...currentMenu, calories: e.target.value })}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentMenu.isPublished}
                                    onChange={(e) => setCurrentMenu({ ...currentMenu, isPublished: e.target.checked })}
                                />
                            }
                            label="Yayınla"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMenuDialog(false)}>İptal</Button>
                    <Button onClick={handleSaveMenu} variant="contained">Kaydet</Button>
                </DialogActions>
            </Dialog>

            {/* Cafeteria Dialog */}
            <Dialog open={openCafeteriaDialog} onClose={() => setOpenCafeteriaDialog(false)}>
                <DialogTitle>Kafeterya Ekle</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            label="İsim"
                            value={currentCafeteria.name}
                            onChange={(e) => setCurrentCafeteria({ ...currentCafeteria, name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Konum"
                            value={currentCafeteria.location}
                            onChange={(e) => setCurrentCafeteria({ ...currentCafeteria, location: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            type="number"
                            label="Kapasite"
                            value={currentCafeteria.capacity}
                            onChange={(e) => setCurrentCafeteria({ ...currentCafeteria, capacity: e.target.value })}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCafeteriaDialog(false)}>İptal</Button>
                    <Button onClick={handleSaveCafeteria} variant="contained">Kaydet</Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};

export default MealManagement;
