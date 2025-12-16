import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
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
import { courseService } from '@/services/courseService';
import { departmentService } from '@/services/departmentService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
// Department options now come from API

export const CourseManagementPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '',
    ects: '',
    syllabusUrl: '',
    departmentId: '',
    prerequisiteIds: [],
  });

  const { data: courses, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      try {
        return await courseService.list();
      } catch (err) {
        console.error('Course list error:', err);
        throw err;
      }
    },
  });

  // Get departments from API to map codes to IDs
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });
  
  // Debug: Log departments when they're loaded
  useEffect(() => {
    if (departments.length > 0) {
      console.log('Departments loaded:', departments.map(d => ({ id: d.id, code: d.code, name: d.name })));
    }
  }, [departments]);
  
  // No need for complex mapping - we use departmentId directly now

  const createMutation = useMutation({
    mutationFn: (payload) => courseService.create(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Ders başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      handleCloseDialog();
    },
    onError: (error) => {
      let errorMsg = error?.response?.data?.message || error?.message || 'Ders oluşturulurken hata oluştu.';
      
      // Provide more helpful error messages for 403 errors
      if (error?.response?.status === 403) {
        errorMsg = `Yetki hatası: ${errorMsg}`;
        if (user?.role !== 'admin') {
          errorMsg += ` Kullanıcı rolü: ${user?.role || 'bilinmiyor'}. Admin rolü gereklidir.`;
        } else {
          errorMsg += ' Token\'ınızın admin yetkileri içerdiğinden emin olun. Çıkış yapıp tekrar giriş yapmayı deneyin.';
        }
      }
      
      console.error('Create course error:', {
        error,
        userRole: user?.role,
        status: error?.response?.status,
        url: error?.config?.url,
      });
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => courseService.update(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Ders başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      handleCloseDialog();
    },
    onError: (error) => {
      let errorMsg = error?.response?.data?.message || error?.message || 'Ders güncellenirken hata oluştu.';
      
      if (error?.response?.status === 403) {
        errorMsg = `Yetki hatası: ${errorMsg}`;
        if (user?.role !== 'admin') {
          errorMsg += ` Kullanıcı rolü: ${user?.role || 'bilinmiyor'}. Admin rolü gereklidir.`;
        }
      }
      
      console.error('Update course error:', error);
      toast.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId) => courseService.delete(courseId),
    onSuccess: (res) => {
      toast.success(res.message || 'Ders başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      let errorMsg = error?.response?.data?.message || error?.message || 'Ders silinirken hata oluştu.';
      
      if (error?.response?.status === 403) {
        errorMsg = `Yetki hatası: ${errorMsg}`;
        if (user?.role !== 'admin') {
          errorMsg += ` Kullanıcı rolü: ${user?.role || 'bilinmiyor'}. Admin rolü gereklidir.`;
        }
      }
      
      console.error('Delete course error:', error);
      toast.error(errorMsg);
    },
  });

  const handleOpenDialog = async (course = null) => {
    if (course) {
      try {
        // Fetch full course details with prerequisites
        const fullCourse = await courseService.getById(course.id);
        setEditingCourse(fullCourse);
        
        // Handle departmentId - it might be in course.department.id or course.departmentId
        const deptId = fullCourse.departmentId 
          || (typeof fullCourse.department === 'object' ? fullCourse.department?.id : null)
          || null;
        
        // Extract prerequisite IDs from course.prerequisites array
        const prereqIds = fullCourse.prerequisites?.map(prereq => {
          // Try different possible structures
          return prereq.prerequisiteCourseId 
            || prereq.prerequisite?.id 
            || (prereq.prerequisite && prereq.prerequisite.id)
            || prereq.id;
        }).filter(Boolean).map(id => id.toString()) || [];
        
        console.log('Course prerequisites:', fullCourse.prerequisites);
        console.log('Extracted prerequisite IDs:', prereqIds);
        
        setFormData({
          code: fullCourse.code || '',
          name: fullCourse.name || '',
          description: fullCourse.description || '',
          credits: fullCourse.credits?.toString() || '',
          ects: fullCourse.ects?.toString() || '',
          syllabusUrl: fullCourse.syllabusUrl || '',
          departmentId: deptId?.toString() || '',
          prerequisiteIds: prereqIds,
        });
      } catch (error) {
        console.error('Error loading course details:', error);
        toast.error('Ders bilgileri yüklenirken bir hata oluştu');
        return;
      }
    } else {
      setEditingCourse(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        credits: '',
        ects: '',
        syllabusUrl: '',
        departmentId: '',
        prerequisiteIds: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: '',
      ects: '',
      syllabusUrl: '',
      departmentId: '',
      prerequisiteIds: [],
    });
  };

  const handleSubmit = () => {
    // Check if departments are loaded
    if (!departments.length) {
      toast.error('Bölümler yükleniyor, lütfen bekleyin...');
      return;
    }
    
    if (!formData.departmentId) {
      toast.error('Lütfen bir bölüm seçin.');
      return;
    }
    
    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      credits: parseInt(formData.credits, 10),
      ects: parseInt(formData.ects, 10),
      syllabusUrl: formData.syllabusUrl.trim() || undefined,
      departmentId: parseInt(formData.departmentId, 10),
      prerequisiteIds: formData.prerequisiteIds.map(id => parseInt(id, 10)),
    };

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (courseId) => {
    if (window.confirm('Bu dersi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(courseId);
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Dersler yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    const isNetworkError = !error?.response && error?.request;
    const errorMessage = isNetworkError
      ? 'Backend sunucusuna bağlanılamıyor. Backend\'in çalıştığından emin olun.'
      : error?.response?.data?.message || error?.message || 'Dersler alınırken bir hata oluştu.';
    
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        <Typography variant="body2" fontWeight="bold" mb={1}>
          Hata: {errorMessage}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Endpoint: GET /api/v1/courses
          {error?.response?.status && ` | Status: ${error.response.status}`}
          {isNetworkError && ' | Network Error - Backend çalışmıyor olabilir'}
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" mb={3}>
        <Typography variant="h4">Ders Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Yeni Ders Ekle
        </Button>
      </Stack>

      {courses && courses.length === 0 ? (
        <Alert severity="info">Henüz ders bulunmuyor.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kod</TableCell>
                  <TableCell>İsim</TableCell>
                  <TableCell>Bölüm</TableCell>
                  <TableCell>Kredi</TableCell>
                  <TableCell>ECTS</TableCell>
                  <TableCell align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses?.map((course) => {
                  // Handle department display - it can be an object or just an ID
                  const getDepartmentName = () => {
                    if (course.department) {
                      // If department is an object, use its name or code
                      if (typeof course.department === 'object') {
                        return course.department.name || course.department.code || course.departmentId;
                      }
                      return course.department;
                    }
                    // If only departmentId exists, find it in departments array
                    if (course.departmentId && departments.length > 0) {
                      const dept = departments.find(d => d.id === course.departmentId);
                      return dept ? `${dept.name} (${dept.code})` : course.departmentId;
                    }
                    return course.departmentId || '-';
                  };

                  return (
                    <TableRow key={course.id}>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>{getDepartmentName()}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.ects}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(course)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(course.id)}
                        color="error"
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingCourse ? 'Ders Düzenle' : 'Yeni Ders Ekle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Ders Kodu"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Ders İsmi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Kredi"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="ECTS"
                type="number"
                value={formData.ects}
                onChange={(e) => setFormData({ ...formData, ects: e.target.value })}
                required
                fullWidth
              />
            </Stack>
            <TextField
              label="Syllabus URL"
              value={formData.syllabusUrl}
              onChange={(e) => setFormData({ ...formData, syllabusUrl: e.target.value })}
              fullWidth
              placeholder="https://..."
            />
            <TextField
              select
              label="Bölüm"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              fullWidth
              required
              disabled={!departments.length}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name} ({dept.code})
                </MenuItem>
              ))}
            </TextField>
            <FormControl fullWidth>
              <InputLabel id="prerequisite-select-label">Ön Koşul Dersler</InputLabel>
              <Select
                labelId="prerequisite-select-label"
                multiple
                value={formData.prerequisiteIds || []}
                onChange={(e) => {
                  const value = typeof e.target.value === 'string' 
                    ? e.target.value.split(',') 
                    : e.target.value;
                  setFormData({ ...formData, prerequisiteIds: value });
                }}
                input={<OutlinedInput label="Ön Koşul Dersler" />}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) return 'Ön koşul seçilmedi';
                  const selectedCourses = courses?.filter(c => selected.includes(c.id.toString()));
                  if (selectedCourses.length === 0) return 'Ön koşul seçilmedi';
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedCourses.map((course) => (
                        <Chip 
                          key={course.id} 
                          label={`${course.code} - ${course.name}`}
                          size="small"
                        />
                      ))}
                    </Box>
                  );
                }}
                disabled={!courses || courses.length === 0}
              >
                {courses?.filter(course => 
                  !editingCourse || course.id !== editingCourse.id
                ).map((course) => (
                  <MenuItem key={course.id} value={course.id.toString()}>
                    <Checkbox checked={(formData.prerequisiteIds || []).includes(course.id.toString())} />
                    <ListItemText 
                      primary={`${course.code} - ${course.name}`}
                      secondary={course.department?.name || course.departmentId || ''}
                    />
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Bu dersi almak için öğrencilerin geçmesi gereken dersleri seçin
              </Typography>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || !departments.length}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Kaydediliyor...'
              : editingCourse
                ? 'Güncelle'
                : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
