import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
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
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import CancelIcon from '@mui/icons-material/CancelRounded';
import Chip from '@mui/material/Chip';
import { sectionService } from '@/services/sectionService';
import { courseService } from '@/services/courseService';
import { enrollmentService } from '@/services/enrollmentService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';

export const SectionManagementPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    sectionNumber: '',
    semester: '',
    year: '',
    instructorId: '',
    capacity: '',
    scheduleItems: [], // [{ day: 'Monday', startTime: '09:00', endTime: '12:00' }, ...]
    scheduleClassroom: '',
  });

  // For faculty, show only their sections. For admin, show all sections
  const { data: sections, isLoading: sectionsLoading, isError: sectionsError, error: sectionsErrorDetail, refetch: refetchSections } = useQuery({
    queryKey: ['admin-sections', user?.role],
    queryFn: async () => {
      try {
        if (user?.role === 'faculty') {
          // For faculty, get only their sections
          return await sectionService.mySections();
        } else {
          // For admin, get all sections
          return await sectionService.list();
        }
      } catch (err) {
        console.error('Section list error:', err);
        throw err;
      }
    },
    enabled: Boolean(user?.role),
  });

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.list(),
  });

  // Faculty listesi için
  const { data: facultyListResponse } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: async () => {
      try {
        const { apiClient } = await import('@/services/apiClient');
        const { data } = await apiClient.get('/users', { params: { role: 'faculty' } });
        return data?.data || data || [];
      } catch (error) {
        console.warn('Faculty listesi alınamadı:', error);
        return [];
      }
    },
  });

  const facultyList = facultyListResponse?.data || facultyListResponse || [];

  // Get pending enrollments and students for selected section
  const { data: pendingEnrollments = [], refetch: refetchPending } = useQuery({
    queryKey: ['pending-enrollments', selectedSection?.id],
    queryFn: () => enrollmentService.getPendingEnrollments(selectedSection.id),
    enabled: Boolean(selectedSection?.id) && studentsDialogOpen,
  });

  const { data: enrolledStudents = [], refetch: refetchEnrolled } = useQuery({
    queryKey: ['section-students', selectedSection?.id],
    queryFn: () => enrollmentService.sectionStudents(selectedSection.id),
    enabled: Boolean(selectedSection?.id) && studentsDialogOpen,
  });

  const approveMutation = useMutation({
    mutationFn: (enrollmentId) => enrollmentService.approveEnrollment(enrollmentId),
    onSuccess: async () => {
      toast.success('Kayıt isteği onaylandı');
      
      const sectionId = selectedSection?.id;
      
      // Invalidate and refetch queries
      const invalidatePromises = [
        queryClient.invalidateQueries({ queryKey: ['pending-enrollments', sectionId] }),
        queryClient.invalidateQueries({ queryKey: ['section-students', sectionId] }),
        queryClient.invalidateQueries({ queryKey: ['section-students'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-sections'] }),
      ];
      
      await Promise.all(invalidatePromises);
      
      // Refetch queries explicitly
      if (sectionId) {
        await Promise.all([
          refetchPending().catch(err => console.error('Error refetching pending:', err)),
          refetchEnrolled().catch(err => console.error('Error refetching enrolled:', err)),
        ]);
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || 'Onaylama sırasında hata oluştu');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (enrollmentId) => enrollmentService.rejectEnrollment(enrollmentId),
    onSuccess: () => {
      toast.success('Kayıt isteği reddedildi');
      queryClient.invalidateQueries({ queryKey: ['pending-enrollments', selectedSection?.id] });
      refetchPending();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || 'Reddetme sırasında hata oluştu');
    },
  });

  const handleOpenStudentsDialog = (section) => {
    setSelectedSection(section);
    setStudentsDialogOpen(true);
  };

  const handleCloseStudentsDialog = () => {
    setStudentsDialogOpen(false);
    setSelectedSection(null);
  };

  const createMutation = useMutation({
    mutationFn: (payload) => sectionService.create(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Section başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Section oluşturulurken hata oluştu. Backend endpoint kontrol edin: POST /api/v1/sections';
      console.error('Create section error:', error);
      toast.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => sectionService.update(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Section başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['admin-sections'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      handleCloseDialog();
    },
    onError: (error) => {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Section güncellenirken hata oluştu. Backend endpoint kontrol edin: PUT /api/v1/sections/:id';
      console.error('Update section error:', error);
      toast.error(errorMsg);
    },
  });

  const handleOpenDialog = (section = null) => {
    if (section) {
      const schedule = section.scheduleJson || {};
      // Convert old format to new format if needed
      let scheduleItems = [];
      if (Array.isArray(schedule.scheduleItems)) {
        // New format: scheduleItems array
        scheduleItems = schedule.scheduleItems;
      } else if (Array.isArray(schedule.days) && schedule.startTime && schedule.endTime) {
        // Old format: days array + single startTime/endTime
        scheduleItems = schedule.days.map(day => ({
          day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));
      }
      
      setEditingSection(section);
      setFormData({
        courseId: section.courseId?.toString() || '',
        sectionNumber: section.sectionNumber?.toString() || '',
        semester: section.semester || '',
        year: section.year?.toString() || '',
        instructorId: section.instructorId?.toString() || '',
        capacity: section.capacity?.toString() || '',
        scheduleItems,
        scheduleClassroom: schedule.classroom || '',
      });
    } else {
      setEditingSection(null);
      setFormData({
        courseId: '',
        sectionNumber: '',
        semester: '',
        year: new Date().getFullYear().toString(),
        instructorId: '',
        capacity: '',
        scheduleItems: [],
        scheduleClassroom: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setFormData({
      courseId: '',
      sectionNumber: '',
      semester: '',
      year: '',
      instructorId: '',
      capacity: '',
      scheduleItems: [],
      scheduleClassroom: '',
    });
  };

  const handleAddScheduleItem = () => {
    setFormData((prev) => ({
      ...prev,
      scheduleItems: [...prev.scheduleItems, { day: 'Monday', startTime: '', endTime: '' }],
    }));
  };

  const handleRemoveScheduleItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.filter((_, i) => i !== index),
    }));
  };

  const handleScheduleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      scheduleItems: prev.scheduleItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = () => {
    // Build scheduleJson from form data
    const scheduleData = 
      formData.scheduleItems.length > 0 || 
      formData.scheduleClassroom
        ? {
            scheduleItems: formData.scheduleItems.filter(
              item => item.day && item.startTime && item.endTime
            ),
            classroom: formData.scheduleClassroom || undefined,
          }
        : undefined;

    const payload = {
      courseId: parseInt(formData.courseId, 10),
      sectionNumber: parseInt(formData.sectionNumber, 10),
      semester: formData.semester.trim(),
      year: parseInt(formData.year, 10),
      instructorId: formData.instructorId ? parseInt(formData.instructorId, 10) : undefined,
      capacity: parseInt(formData.capacity, 10),
      scheduleJson: scheduleData,
    };

    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (sectionsLoading || coursesLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Sectionlar yükleniyor...</Typography>
      </Stack>
    );
  }

  if (sectionsError) {
    const errorMessage =
      sectionsErrorDetail?.response?.data?.message ||
      sectionsErrorDetail?.message ||
      'Sectionlar alınırken bir hata oluştu. Backend API endpoint\'i kontrol edin.';
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetchSections()}>Tekrar dene</Button>}
      >
        <Typography variant="body2" fontWeight="bold" mb={1}>
          Hata: {errorMessage}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Endpoint: GET /api/v1/sections
          {sectionsErrorDetail?.response?.status && ` | Status: ${sectionsErrorDetail.response.status}`}
        </Typography>
      </Alert>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isFaculty = user?.role === 'faculty';

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          {isFaculty ? 'Sectionlarım' : 'Section Yönetimi'}
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Yeni Section Ekle
          </Button>
        )}
      </Stack>

      {sections && sections.length === 0 ? (
        <Alert severity="info">Henüz section bulunmuyor.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ders</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Dönem</TableCell>
                  <TableCell>Yıl</TableCell>
                  <TableCell>Eğitmen</TableCell>
                  <TableCell>Ders Programı</TableCell>
                  <TableCell>Ders Yeri</TableCell>
                  <TableCell>Kapasite</TableCell>
                  <TableCell>Kayıtlı</TableCell>
                  <TableCell align="right">İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections?.map((section) => {
                  // Parse scheduleJson
                  let schedule = section.scheduleJson;
                  if (typeof schedule === 'string') {
                    try {
                      schedule = JSON.parse(schedule);
                    } catch (e) {
                      schedule = null;
                    }
                  }
                  schedule = schedule || {};
                  
                  const dayLabels = {
                    Monday: 'Pazartesi',
                    Tuesday: 'Salı',
                    Wednesday: 'Çarşamba',
                    Thursday: 'Perşembe',
                    Friday: 'Cuma',
                  };
                  
                  let scheduleText = 'Belirtilmemiş';
                  
                  // New format: scheduleItems array
                  if (Array.isArray(schedule.scheduleItems) && schedule.scheduleItems.length > 0) {
                    const scheduleTexts = schedule.scheduleItems.map(item => {
                      const dayLabel = dayLabels[item.day] || item.day;
                      const timeStr = item.startTime && item.endTime 
                        ? ` (${item.startTime}-${item.endTime})` 
                        : '';
                      return `${dayLabel}${timeStr}`;
                    });
                    scheduleText = scheduleTexts.join(', ');
                  } 
                  // Old format: days array + single startTime/endTime
                  else if (Array.isArray(schedule.days) && schedule.days.length > 0) {
                    scheduleText = schedule.days.map(day => dayLabels[day] || day).join(', ');
                    if (schedule.startTime && schedule.endTime) {
                      scheduleText += ` (${schedule.startTime}-${schedule.endTime})`;
                    }
                  }
                  
                  const classroom = schedule.classroom || 'Belirtilmemiş';
                  
                  return (
                    <TableRow key={section.id}>
                      <TableCell>
                        {section.course?.code || section.courseCode || 'N/A'}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {section.course?.name || section.courseName || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{section.sectionNumber}</TableCell>
                      <TableCell>{section.semester}</TableCell>
                      <TableCell>{section.year}</TableCell>
                      <TableCell>
                        {section.instructor?.fullName || section.instructorName || 'Atanmamış'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{scheduleText}</Typography>
                      </TableCell>
                      <TableCell>{classroom}</TableCell>
                      <TableCell>{section.capacity}</TableCell>
                      <TableCell>{section.enrolledCount || 0}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenStudentsDialog(section)}
                          color="primary"
                          title="Öğrencileri Görüntüle"
                        >
                          <PeopleIcon />
                        </IconButton>
                        {isAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(section)}
                            color="primary"
                            title="Düzenle"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
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
        <DialogTitle>
          {editingSection ? 'Section Düzenle' : 'Yeni Section Ekle'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Ders"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              required
              fullWidth
            >
              {courses?.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Section Numarası"
                type="number"
                value={formData.sectionNumber}
                onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Dönem"
                select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
                fullWidth
              >
                <MenuItem value="Fall">Güz</MenuItem>
                <MenuItem value="Spring">Bahar</MenuItem>
                <MenuItem value="Summer">Yaz</MenuItem>
              </TextField>
              <TextField
                label="Yıl"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                fullWidth
              />
            </Stack>
            <TextField
              select
              label="Eğitmen"
              value={formData.instructorId}
              onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Eğitmen Seçin (Opsiyonel)</MenuItem>
              {facultyList && facultyList.length > 0 ? (
                facultyList.map((faculty) => (
                  <MenuItem key={faculty.id} value={faculty.id}>
                    {faculty.fullName} ({faculty.email})
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  Eğitmen listesi yükleniyor...
                </MenuItem>
              )}
            </TextField>
            <TextField
              label="Kapasite"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
              fullWidth
            />
            
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2">
                  Ders Programı (Opsiyonel)
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddScheduleItem}
                >
                  Program Ekle
                </Button>
              </Stack>
              <Stack spacing={2} mt={1}>
                {formData.scheduleItems.map((item, index) => {
                  const dayLabels = {
                    Monday: 'Pazartesi',
                    Tuesday: 'Salı',
                    Wednesday: 'Çarşamba',
                    Thursday: 'Perşembe',
                    Friday: 'Cuma',
                  };
                  return (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                          select
                          label="Gün"
                          value={item.day}
                          onChange={(e) => handleScheduleItemChange(index, 'day', e.target.value)}
                          sx={{ minWidth: 150 }}
                          size="small"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                            <MenuItem key={day} value={day}>
                              {dayLabels[day]}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Başlangıç"
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleScheduleItemChange(index, 'startTime', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          sx={{ minWidth: 120 }}
                        />
                        <TextField
                          label="Bitiş"
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleScheduleItemChange(index, 'endTime', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                          sx={{ minWidth: 120 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveScheduleItem(index)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Stack>
                    </Box>
                  );
                })}
                {formData.scheduleItems.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Henüz program eklenmedi. "Program Ekle" butonuna tıklayarak ekleyebilirsiniz.
                  </Typography>
                )}
                <TextField
                  label="Ders Yeri"
                  value={formData.scheduleClassroom}
                  onChange={(e) => setFormData({ ...formData, scheduleClassroom: e.target.value })}
                  placeholder="Örn: A101, B205"
                  fullWidth
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Kaydediliyor...'
              : editingSection
                ? 'Güncelle'
                : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Students and Pending Enrollments Dialog */}
      <Dialog open={studentsDialogOpen} onClose={handleCloseStudentsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSection && (
            <>
              {selectedSection.course?.code || selectedSection.courseCode} - Section {selectedSection.sectionNumber}
              <Typography variant="body2" color="text.secondary" mt={1}>
                {selectedSection.course?.name || selectedSection.courseName}
              </Typography>
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Pending Enrollments */}
            <Box>
              <Typography variant="h6" mb={2}>
                Bekleyen Kayıt İstekleri
              </Typography>
              {pendingEnrollments.length === 0 ? (
                <Alert severity="info">Bekleyen kayıt isteği yok.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Öğrenci Adı</TableCell>
                      <TableCell>Öğrenci Numarası</TableCell>
                      <TableCell>İstek Tarihi</TableCell>
                      <TableCell align="right">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.enrollmentId}>
                        <TableCell>{enrollment.studentName}</TableCell>
                        <TableCell>{enrollment.studentNumber}</TableCell>
                        <TableCell>
                          {new Date(enrollment.enrollmentDate).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="success"
                            variant="outlined"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => approveMutation.mutate(enrollment.enrollmentId)}
                            disabled={approveMutation.isPending}
                          >
                            Onayla
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => rejectMutation.mutate(enrollment.enrollmentId)}
                            disabled={rejectMutation.isPending}
                            sx={{ ml: 1 }}
                          >
                            Reddet
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            {/* Enrolled Students */}
            <Box>
              <Typography variant="h6" mb={2}>
                Kayıtlı Öğrenciler ({enrolledStudents.length})
              </Typography>
              {enrolledStudents.length === 0 ? (
                <Alert severity="info">Kayıtlı öğrenci yok.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Öğrenci Adı</TableCell>
                      <TableCell>Öğrenci Numarası</TableCell>
                      <TableCell>Vize</TableCell>
                      <TableCell>Final</TableCell>
                      <TableCell>Harf Notu</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrolledStudents.map((student) => (
                      <TableRow key={student.enrollmentId}>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>{student.studentNumber}</TableCell>
                        <TableCell>{student.midtermGrade ?? '-'}</TableCell>
                        <TableCell>{student.finalGrade ?? '-'}</TableCell>
                        <TableCell>
                          {student.letterGrade ? (
                            <Chip label={student.letterGrade} size="small" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStudentsDialog}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
