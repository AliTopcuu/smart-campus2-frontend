import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/hooks/useToast';

export const ClassroomManagementPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  // Common classroom features
  const availableFeatures = [
    'projector',
    'whiteboard',
    'smartboard',
    'computer',
    'sound_system',
    'air_conditioning',
    'wifi',
    'microphone',
    'camera',
    'wheelchair_accessible'
  ];

  const [formData, setFormData] = useState({
    building: '',
    roomNumber: '',
    capacity: '',
    features: {} // Object with feature names as keys and boolean values
  });
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get classrooms
  const { data: classrooms = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { data } = await apiClient.get('/courses/classrooms');
      console.log('Fetched classrooms:', data);
      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache (formerly cacheTime)
  });

  // Debug: Log when classrooms change
  useEffect(() => {
    console.log('Classrooms state updated:', classrooms);
    console.log('Classrooms count:', classrooms.length);
  }, [classrooms]);

  // Create classroom mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      try {
        console.log('Creating classroom with data:', data);
        const response = await apiClient.post('/courses/classrooms', data);
        console.log('Create response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Create classroom error:', error);
        throw error;
      }
    },
    onSuccess: async (newClassroom) => {
      console.log('Create mutation success, new classroom:', newClassroom);
      handleCloseDialog();
      showToast('Derslik başarıyla oluşturuldu', 'success');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      try {
        const result = await refetch();
        console.log('Refetch completed successfully, data:', result.data);
      } catch (error) {
        console.error('Refetch error:', error);
      }
    },
    onError: (error) => {
      console.error('Create mutation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Derslik oluşturulamadı';
      showToast(errorMessage, 'error');
    }
  });

  // Update classroom mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.put(`/courses/classrooms/${id}`, data);
        return response.data;
      } catch (error) {
        console.error('Update classroom error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      handleCloseDialog();
      showToast('Derslik başarıyla güncellendi', 'success');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      try {
        await refetch();
        console.log('Refetch completed successfully');
      } catch (error) {
        console.error('Refetch error:', error);
      }
    },
    onError: (error) => {
      console.error('Update mutation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Derslik güncellenemedi';
      showToast(errorMessage, 'error');
    }
  });

  // Delete classroom mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        await apiClient.delete(`/courses/classrooms/${id}`);
        return id;
      } catch (error) {
        console.error('Delete classroom error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      showToast('Derslik başarıyla silindi', 'success');
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      try {
        await refetch();
        console.log('Refetch completed successfully');
      } catch (error) {
        console.error('Refetch error:', error);
      }
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Derslik silinemedi';
      showToast(errorMessage, 'error');
    }
  });

  const handleOpenDialog = (classroom = null) => {
    if (classroom) {
      setEditingClassroom(classroom);
      // Convert featuresJson to features object
      const features = {};
      if (classroom.featuresJson && typeof classroom.featuresJson === 'object') {
        availableFeatures.forEach(feature => {
          features[feature] = classroom.featuresJson[feature] || false;
        });
      } else {
        availableFeatures.forEach(feature => {
          features[feature] = false;
        });
      }
      setFormData({
        building: classroom.building || '',
        roomNumber: classroom.roomNumber || '',
        capacity: classroom.capacity || '',
        features
      });
    } else {
      setEditingClassroom(null);
      const features = {};
      availableFeatures.forEach(feature => {
        features[feature] = false;
      });
      setFormData({
        building: '',
        roomNumber: '',
        capacity: '',
        features
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClassroom(null);
    const features = {};
    availableFeatures.forEach(feature => {
      features[feature] = false;
    });
    setFormData({
      building: '',
      roomNumber: '',
      capacity: '',
      features
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.building || !formData.roomNumber || !formData.capacity) {
      showToast('Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    // Filter only true features
    const activeFeatures = {};
    Object.keys(formData.features).forEach(key => {
      if (formData.features[key]) {
        activeFeatures[key] = true;
      }
    });

    const submitData = {
      building: formData.building.trim(),
      roomNumber: formData.roomNumber.trim(),
      capacity: parseInt(formData.capacity),
      featuresJson: Object.keys(activeFeatures).length > 0 ? activeFeatures : null
    };

    console.log('Submitting data:', submitData);

    if (editingClassroom) {
      updateMutation.mutate({ id: editingClassroom.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleFeatureToggle = (feature) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature]
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu dersliği silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading || isFetching) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Derslik Yönetimi</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Yeni Derslik
        </Button>
      </Stack>

      {classrooms.length === 0 ? (
        <Alert severity="info">Henüz derslik bulunmamaktadır. Yeni derslik ekleyin.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bina</TableCell>
                  <TableCell>Oda Numarası</TableCell>
                  <TableCell>Kapasite</TableCell>
                  <TableCell>Özellikler</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classrooms.map((classroom) => (
                  <TableRow key={classroom.id}>
                    <TableCell>{classroom.building}</TableCell>
                    <TableCell>{classroom.roomNumber}</TableCell>
                    <TableCell>{classroom.capacity}</TableCell>
                    <TableCell>
                      {classroom.featuresJson && Object.keys(classroom.featuresJson).length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                          {Object.keys(classroom.featuresJson).map(feature => (
                            <Chip
                              key={feature}
                              label={feature.replace(/_/g, ' ')}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(classroom)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(classroom.id)}
                        color="error"
                        disabled={deleteMutation.isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClassroom ? 'Derslik Düzenle' : 'Yeni Derslik'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3} mt={1}>
              <TextField
                label="Bina"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Oda Numarası"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Kapasite"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                fullWidth
                inputProps={{ min: 1 }}
              />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Özellikler
                </Typography>
                <Stack spacing={1}>
                  {availableFeatures.map((feature) => (
                    <FormControlLabel
                      key={feature}
                      control={
                        <Checkbox
                          checked={formData.features[feature] || false}
                          onChange={() => handleFeatureToggle(feature)}
                        />
                      }
                      label={feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <CircularProgress size={20} />
              ) : (
                editingClassroom ? 'Güncelle' : 'Oluştur'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

