import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import { departmentService } from '@/services/departmentService';
import { useToast } from '@/hooks/useToast';

export const DepartmentManagementPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty: '',
  });

  const { data: departments, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => departmentService.create(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Bölüm başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Bölüm oluşturulurken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => departmentService.update(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Bölüm başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Bölüm güncellenirken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => departmentService.delete(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Bölüm başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Bölüm silinirken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name || '',
        code: department.code || '',
        faculty: department.faculty || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        code: '',
        faculty: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      faculty: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.faculty) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (editingDepartment) {
      updateMutation.mutate({
        id: editingDepartment.id,
        payload: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu bölümü silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Bölümler yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Tekrar dene</Button>}>
        {error?.response?.data?.message || error?.message || 'Bölümler yüklenirken hata oluştu'}
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Bölüm Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Bölüm Ekle
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Bölüm Adı</TableCell>
                <TableCell>Bölüm Kodu</TableCell>
                <TableCell>Fakülte</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments && departments.length > 0 ? (
                departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>{department.code}</TableCell>
                    <TableCell>{department.faculty}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(department)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(department.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" py={2}>
                      Henüz bölüm eklenmemiş
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Bölüm Düzenle' : 'Yeni Bölüm Ekle'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Bölüm Adı"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Bölüm Kodu"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
              helperText="Örnek: bilgisayar-muhendisligi"
            />
            <TextField
              label="Fakülte"
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              fullWidth
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Kaydediliyor...'
              : editingDepartment
              ? 'Güncelle'
              : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
