import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import CancelIcon from '@mui/icons-material/CancelRounded';
import { sectionService } from '@/services/sectionService';
import { enrollmentService } from '@/services/enrollmentService';
import { useToast } from '@/hooks/useToast';

import { useAuth } from '@/context/AuthContext';

export const MySectionsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const { data: sections, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-sections', user?.id],
    queryFn: () => sectionService.mySections(),
    staleTime: 0,
    cacheTime: 0,
    enabled: !!user,
  });

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

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Sectionlarınız yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Sectionlarınız listesi alınamadı.';
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        {errorMessage}
      </Alert>
    );
  }

  const sectionsList = Array.isArray(sections) ? sections : [];

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Derslerim
      </Typography>

      {sectionsList.length === 0 ? (
        <Alert severity="info">Henüz size atanmış section bulunmuyor.</Alert>
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
                  <TableCell>Ders Programı</TableCell>
                  <TableCell>Ders Yeri</TableCell>
                  <TableCell>Kapasite</TableCell>
                  <TableCell>Kayıtlı</TableCell>
                  <TableCell align="right">İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectionsList.map((section) => {
                  // Parse schedule information - handle string from Sequelize JSONB
                  let schedule = section.scheduleJson;

                  // Debug log
                  if (process.env.NODE_ENV === 'development') {
                    console.log('MySectionsPage - Section schedule data:', {
                      sectionId: section.id,
                      scheduleJson: schedule,
                      scheduleType: typeof schedule,
                      section: section
                    });
                  }

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
                        <Typography fontWeight={600}>
                          {section.course?.code || section.courseCode || 'N/A'}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {section.course?.name || section.courseName || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{section.sectionNumber}</TableCell>
                      <TableCell>{section.semester}</TableCell>
                      <TableCell>{section.year}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{scheduleText}</Typography>
                      </TableCell>
                      <TableCell>{classroom}</TableCell>
                      <TableCell>{section.capacity}</TableCell>
                      <TableCell>
                        {section.enrolledCount || 0}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenStudentsDialog(section)}
                          color="primary"
                          title="Öğrencileri Görüntüle"
                        >
                          <PeopleIcon />
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

      {/* Students and Pending Enrollments Dialog */}
      <Dialog open={studentsDialogOpen} onClose={handleCloseStudentsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedSection && (
            <>
              {selectedSection.course?.code || selectedSection.courseCode} - Section {selectedSection.sectionNumber}
              <Typography variant="body2" color="text.secondary" mt={1}>
                {selectedSection.course?.name || selectedSection.courseName}
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
