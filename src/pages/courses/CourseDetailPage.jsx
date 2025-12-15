import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import CancelIcon from '@mui/icons-material/CancelRounded';
import WarningIcon from '@mui/icons-material/WarningAmberRounded';
import DescriptionIcon from '@mui/icons-material/Description';
import { courseService } from '@/services/courseService';
import { enrollmentService } from '@/services/enrollmentService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const isFaculty = user?.role === 'faculty';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['course', id],
    queryFn: () => (id ? courseService.getById(id) : Promise.reject()),
    enabled: Boolean(id),
  });

  // Get pending enrollments for faculty
  const { data: pendingEnrollments = [], refetch: refetchPending } = useQuery({
    queryKey: ['pending-enrollments', selectedSection?.id],
    queryFn: () => enrollmentService.getPendingEnrollments(selectedSection.id),
    enabled: Boolean(selectedSection?.id) && studentsDialogOpen && isFaculty,
  });

  const { data: enrolledStudents = [], refetch: refetchEnrolled } = useQuery({
    queryKey: ['section-students', selectedSection?.id],
    queryFn: () => enrollmentService.sectionStudents(selectedSection.id),
    enabled: Boolean(selectedSection?.id) && studentsDialogOpen && isFaculty,
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
        queryClient.invalidateQueries({ queryKey: ['course', id] }),
      ];
      
      await Promise.all(invalidatePromises);
      
      // Refetch queries explicitly
      if (sectionId) {
        await Promise.all([
          refetchPending().catch(err => console.error('Error refetching pending:', err)),
          refetchEnrolled().catch(err => console.error('Error refetching enrolled:', err)),
        ]);
      }
      
      await refetch().catch(err => console.error('Error refetching course:', err));
    },
    onError: (error) => {
      console.error('Approve enrollment error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          (error?.response?.status === 403 ? 'Bu section için yetkiniz yok' : 
                           error?.response?.status === 404 ? 'Kayıt bulunamadı' :
                           error?.response?.status === 400 ? 'Geçersiz işlem' :
                           'Onaylama sırasında hata oluştu');
      toast.error(errorMessage);
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

  const enrollMutation = useMutation({
    mutationFn: (sectionId) => {
      // Ensure sectionId is a number
      const numSectionId = typeof sectionId === 'string' ? parseInt(sectionId, 10) : Number(sectionId);
      if (isNaN(numSectionId) || numSectionId <= 0) {
        throw new Error('Geçersiz section ID');
      }
      console.log('Enrolling with sectionId:', numSectionId, 'type:', typeof numSectionId);
      return enrollmentService.enroll({ sectionId: numSectionId });
    },
    onSuccess: (res) => {
      toast.success(res.message ?? 'Kayıt isteği gönderildi. Eğitmen onayını bekliyor.');
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      setSelectedSection(null);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Kayıt sırasında hata oluştu';
      toast.error(errorMessage);
    },
  });

  const handleEnrollClick = (section) => {
    setSelectedSection(section);
  };

  const handleConfirmEnroll = () => {
    if (!selectedSection || !selectedSection.id) {
      toast.error('Geçersiz section bilgisi');
      return;
    }
    enrollMutation.mutate(selectedSection.id);
  };

  const renderPrerequisites = (course) => {
    if (!course.prerequisites?.length) {
      return <Typography color="text.secondary">Ön koşul bulunmuyor.</Typography>;
    }
    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
        {course.prerequisites.map((prereq) => (
          <Chip
            key={prereq.id || prereq.courseId}
            label={`${prereq.code || prereq.courseCode} - ${prereq.name || prereq.courseName}`}
            size="small"
            component={Link}
            to={`/courses/${prereq.id || prereq.courseId || prereq.prerequisiteCourseId}`}
            clickable
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Stack>
    );
  };

  const renderSections = (course) => {
    if (!course.sections?.length) {
      return <Typography color="text.secondary">Bu ders için section bulunmuyor.</Typography>;
    }

    const isStudent = user?.role === 'student';
    
    // For faculty, filter to show only their sections
    const sectionsToShow = isFaculty 
      ? course.sections.filter(section => section.instructorId === user.id)
      : course.sections;

    if (isFaculty && sectionsToShow.length === 0) {
      return <Typography color="text.secondary">Bu derste size atanmış section bulunmuyor.</Typography>;
    }

    return (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Section</TableCell>
            {!isFaculty && <TableCell>Eğitmen</TableCell>}
            <TableCell>Ders Programı</TableCell>
            <TableCell>Ders Yeri</TableCell>
            <TableCell align="center">Kapasite</TableCell>
            <TableCell align="right">İşlem</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sectionsToShow.map((section) => {
            const available = section.enrolledCount < section.capacity;
            // Handle instructor - it might be an object or a string
            const instructorName = typeof section.instructor === 'object'
              ? section.instructor?.fullName || section.instructor?.name || section.instructor?.email || '-'
              : section.instructor || '-';
            
            // Parse scheduleJson - handle both new and old format
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
            // Fallback to scheduleText if exists
            else if (section.scheduleText && section.scheduleText !== 'TBA' && section.scheduleText !== '-') {
              scheduleText = section.scheduleText;
            }
            
            const classroom = schedule.classroom || 'Belirtilmemiş';
            
            return (
              <TableRow key={section.id}>
                <TableCell>{section.sectionNumber}</TableCell>
                {!isFaculty && <TableCell>{instructorName}</TableCell>}
                <TableCell>
                  <Typography variant="body2">{scheduleText}</Typography>
                </TableCell>
                <TableCell>{classroom}</TableCell>
                <TableCell align="center">
                  {section.enrolledCount}/{section.capacity}{' '}
                  {available ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                  ) : (
                    <WarningIcon fontSize="small" color="warning" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {isStudent ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEnrollClick(section)}
                      disabled={!available}
                    >
                      {available ? 'Kayıt İsteği Gönder' : 'Dolu'}
                    </Button>
                  ) : isFaculty ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenStudentsDialog(section)}
                    >
                      Öğrencileri Görüntüle
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Ders bilgileri yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        Ders bilgisi alınamadı.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={2}>
        {data.code} - {data.name}
      </Typography>
      <Typography color="text.secondary" mb={3}>
        {typeof data.department === 'object' 
          ? data.department?.name || data.department?.code || data.departmentId
          : data.department || data.departmentId || '-'} • {data.credits} Kredi • {data.ects} ECTS
      </Typography>

      {data.description && (
        <Typography mb={2} color="text.secondary">
          {data.description}
        </Typography>
      )}

      {data.syllabusUrl && (
        <Box mb={4}>
          <Button
            variant="outlined"
            startIcon={<DescriptionIcon />}
            href={data.syllabusUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ders Programını Görüntüle
          </Button>
        </Box>
      )}

      <Box mb={4}>
        <Typography variant="h6">Ön Koşullar</Typography>
        {renderPrerequisites(data)}
      </Box>

      <Box>
        <Typography variant="h6" mb={2}>
          Sectionlar
        </Typography>
        {renderSections(data)}
      </Box>

      {/* Student Enrollment Dialog */}
      <Dialog open={Boolean(selectedSection) && user?.role === 'student'} onClose={() => setSelectedSection(null)}>
        <DialogTitle>Derse Kayıt İsteği Gönder</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedSection
              ? `${selectedSection.sectionNumber} numaralı section için kayıt isteği göndereceksiniz. İstek eğitmen onayından sonra aktif olacaktır. Onaylıyor musunuz?`
              : 'Section seçilmedi.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSection(null)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleConfirmEnroll}
            disabled={enrollMutation.isPending}
          >
            {enrollMutation.isPending ? 'Gönderiliyor...' : 'İstek Gönder'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Faculty Students Dialog */}
      <Dialog open={studentsDialogOpen && isFaculty} onClose={handleCloseStudentsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSection && (
            <>
              Section {selectedSection.sectionNumber}
              <Typography variant="body2" color="text.secondary" mt={1}>
                {data?.code} - {data?.name}
              </Typography>
              {selectedSection.scheduleJson && (
                <Box mt={2}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Ders Programı:
                  </Typography>
                  {(() => {
                    let schedule = selectedSection.scheduleJson;
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
                    
                    if (Array.isArray(schedule.scheduleItems) && schedule.scheduleItems.length > 0) {
                      return (
                        <Stack spacing={0.5}>
                          {schedule.scheduleItems.map((item, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">
                              {dayLabels[item.day] || item.day}: {item.startTime} - {item.endTime}
                            </Typography>
                          ))}
                          {schedule.classroom && (
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              Ders Yeri: {schedule.classroom}
                            </Typography>
                          )}
                        </Stack>
                      );
                    } else if (Array.isArray(schedule.days) && schedule.days.length > 0) {
                      return (
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.days.map(day => dayLabels[day] || day).join(', ')}
                            {schedule.startTime && schedule.endTime && `: ${schedule.startTime} - ${schedule.endTime}`}
                          </Typography>
                          {schedule.classroom && (
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              Ders Yeri: {schedule.classroom}
                            </Typography>
                          )}
                        </Stack>
                      );
                    }
                    return <Typography variant="body2" color="text.secondary">Belirtilmemiş</Typography>;
                  })()}
                </Box>
              )}
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Pending Enrollments */}
            <Box>
              <Typography variant="h6" mb={2}>
                Bekleyen Kayıt İstekleri {pendingEnrollments.length > 0 && `(${pendingEnrollments.length})`}
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

