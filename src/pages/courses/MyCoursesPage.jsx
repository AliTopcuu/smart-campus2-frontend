import { useState } from 'react';
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
import { enrollmentService } from '@/services/enrollmentService';
import { useToast } from '@/hooks/useToast';

const getAttendanceStatus = (percentage) => {
  if (percentage === undefined || percentage === null)
    return { label: 'N/A', color: 'default' };
  if (percentage >= 80) return { label: 'OK', color: 'success' };
  if (percentage >= 70) return { label: 'Warning', color: 'warning' }; // >= 20% absence
  return { label: 'Critical', color: 'error' }; // >= 30% absence
};

export const MyCoursesPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => enrollmentService.myCourses(),
    staleTime: 0, // Always refetch when component mounts
    cacheTime: 0, // Don't cache data
  });

  const dropMutation = useMutation({
    mutationFn: (enrollmentId) => enrollmentService.drop(enrollmentId),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Ders bırakıldı');
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      setSelectedEnrollment(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'İşlem sırasında hata oluştu');
    },
  });

  const handleDropClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
  };

  const handleConfirmDrop = () => {
    if (!selectedEnrollment) return;
    dropMutation.mutate(selectedEnrollment.enrollmentId);
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Dersleriniz yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Derslerim listesi alınamadı.';
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        {errorMessage}
      </Alert>
    );
  }

  // Ensure data is an array
  const courses = Array.isArray(data) ? data : [];

  // Debug: Log the data we received
  console.log('MyCoursesPage - Received data:', {
    data,
    isArray: Array.isArray(data),
    coursesCount: courses.length,
    firstCourse: courses[0] ? {
      enrollmentId: courses[0].enrollmentId,
      hasSection: !!courses[0].section,
      sectionKeys: courses[0].section ? Object.keys(courses[0].section) : [],
      sectionScheduleJson: courses[0].section?.scheduleJson
    } : null
  });

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Derslerim
      </Typography>

      {courses.length === 0 ? (
        <Alert severity="info">Henüz kayıtlı dersiniz yok.</Alert>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ders</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Eğitmen</TableCell>
                <TableCell>Ders Programı</TableCell>
                <TableCell>Ders Yeri</TableCell>
                <TableCell>Yoklama</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((enrollment) => {
                const status = getAttendanceStatus(enrollment.attendancePercentage);
                // Parse schedule information - support both new and old format
                // Handle case where scheduleJson might be a string (from Sequelize JSONB)
                let schedule = enrollment.section?.scheduleJson;

                // Debug log - always log to see what we're getting
                console.log('MyCoursesPage - Enrollment schedule data:', {
                  enrollmentId: enrollment.enrollmentId,
                  scheduleJson: schedule,
                  scheduleType: typeof schedule,
                  section: enrollment.section,
                  sectionKeys: enrollment.section ? Object.keys(enrollment.section) : [],
                  sectionScheduleJson: enrollment.section?.scheduleJson,
                  fullEnrollment: enrollment
                });

                // If scheduleJson is null/undefined, try to get it from section object directly
                if (!schedule && enrollment.section) {
                  // Try different possible property names
                  schedule = enrollment.section.scheduleJson ||
                    enrollment.section.schedule ||
                    null;
                  console.log('Tried alternative access methods, schedule:', schedule);
                }

                // If still null, check if it's in the root enrollment object (backend might return it there)
                if (!schedule && enrollment.scheduleJson) {
                  schedule = enrollment.scheduleJson;
                  console.log('Found scheduleJson in root enrollment object:', schedule);
                }

                if (typeof schedule === 'string') {
                  try {
                    schedule = JSON.parse(schedule);
                    console.log('Parsed scheduleJson from string:', schedule);
                  } catch (e) {
                    console.error('Error parsing scheduleJson in MyCoursesPage:', e, schedule);
                    schedule = null;
                  }
                }

                // If schedule is still null/undefined, set to empty object
                schedule = schedule || {};
                console.log('Final schedule object:', schedule, 'has scheduleItems:', Array.isArray(schedule.scheduleItems));

                const dayLabels = {
                  Monday: 'Pazartesi',
                  Tuesday: 'Salı',
                  Wednesday: 'Çarşamba',
                  Thursday: 'Perşembe',
                  Friday: 'Cuma',
                };

                let days = 'Belirtilmemiş';
                let time = '';

                // New format: scheduleItems array
                if (Array.isArray(schedule.scheduleItems) && schedule.scheduleItems.length > 0) {
                  const scheduleTexts = schedule.scheduleItems.map(item => {
                    const dayLabel = dayLabels[item.day] || item.day;
                    const timeStr = item.startTime && item.endTime
                      ? ` (${item.startTime}-${item.endTime})`
                      : '';
                    return `${dayLabel}${timeStr}`;
                  });
                  days = scheduleTexts.join(', ');
                }
                // Old format: days array + single startTime/endTime
                else if (Array.isArray(schedule.days) && schedule.days.length > 0) {
                  days = schedule.days.map(day => dayLabels[day] || day).join(', ');
                  if (schedule.startTime && schedule.endTime) {
                    time = `${schedule.startTime} - ${schedule.endTime}`;
                  }
                }
                // Fallback to scheduleText
                else if (enrollment.section?.scheduleText && enrollment.section.scheduleText !== 'TBA') {
                  days = enrollment.section.scheduleText;
                }

                const classroom = schedule.classroom || 'Belirtilmemiş';

                return (
                  <TableRow key={enrollment.enrollmentId}>
                    <TableCell>
                      <Typography fontWeight={600}>{enrollment.course?.code || 'N/A'}</Typography>
                      <Typography color="text.secondary">{enrollment.course?.name || 'Bilinmiyor'}</Typography>
                    </TableCell>
                    <TableCell>{enrollment.section.sectionNumber}</TableCell>
                    <TableCell>{enrollment.section.instructor}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{days}</Typography>
                      {time && (
                        <Typography variant="caption" color="text.secondary">
                          {time}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{classroom}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          enrollment.attendancePercentage !== undefined
                            ? `${status.label} (${enrollment.attendancePercentage}%)`
                            : status.label
                        }
                        color={status.color === 'default' ? undefined : status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={() => handleDropClick(enrollment)}
                      >
                        Dersten Ayrıl
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Dialog
            open={Boolean(selectedEnrollment)}
            onClose={() => setSelectedEnrollment(null)}
          >
            <DialogTitle>Dersden Ayrıl</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {selectedEnrollment
                  ? `${selectedEnrollment.course?.code || ''} ${selectedEnrollment.course?.name || ''} dersinden ayrılmak üzeresiniz.`
                  : 'Ders seçilmedi.'}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEnrollment(null)}>İptal</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmDrop}
                disabled={dropMutation.isPending}
              >
                {dropMutation.isPending ? 'İşleniyor...' : 'Onayla'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

