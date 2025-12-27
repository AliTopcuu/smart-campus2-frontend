import { Box, Card, CardContent, Typography, CircularProgress, Alert, Stack, Chip, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { WeeklyScheduleCalendar } from '@/components/schedule/WeeklyScheduleCalendar';
import { enrollmentService } from '@/services/enrollmentService';
import { sectionService } from '@/services/sectionService';
import { AdminDashboardPage } from '@/pages/admin/analytics/AdminDashboardPage';

const overviewCards = [
  { title: 'Kimlik Yönetimi', description: 'Kullanıcı rollerini yönetin, yeni kullanıcılar oluşturun.' },
  { title: 'Akademik Durum', description: 'Ders kayıtlarınızı ve danışman geri bildirimlerini görüntüleyin.' },
  { title: 'Yoklama & GPS', description: 'Ders bazında yoklamalarınızı takip edin.' },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  // Admin için AdminDashboardPage göster
  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  // Fetch courses for students
  const { data: studentCourses, isLoading: isLoadingStudentCourses, isError: isErrorStudentCourses } = useQuery({
    queryKey: ['dashboard-student-courses'],
    queryFn: () => enrollmentService.myCourses(),
    enabled: isStudent,
    staleTime: 0,
  });

  // Fetch sections for faculty
  const { data: facultySections, isLoading: isLoadingFacultySections, isError: isErrorFacultySections } = useQuery({
    queryKey: ['dashboard-faculty-sections'],
    queryFn: () => sectionService.mySections(),
    enabled: isFaculty,
    staleTime: 0,
  });

  // Prepare sections data for calendar
  const getSectionsForCalendar = () => {
    if (isStudent && studentCourses) {
      // For students, extract sections from enrollments
      return studentCourses.map((enrollment) => ({
        id: enrollment.section?.id || enrollment.sectionId,
        sectionNumber: enrollment.section?.sectionNumber,
        scheduleJson: enrollment.section?.scheduleJson,
        course: enrollment.course,
        classroom: enrollment.section?.classroom,
      })).filter((section) => section.id); // Filter out invalid sections
    }
    if (isFaculty && facultySections) {
      // For faculty, use sections directly
      return facultySections.map((section) => ({
        id: section.id,
        sectionNumber: section.sectionNumber,
        scheduleJson: section.scheduleJson,
        course: section.course,
        classroom: section.classroom,
      }));
    }
    return [];
  };

  const sections = getSectionsForCalendar();
  const isLoadingSchedule = (isStudent && isLoadingStudentCourses) || (isFaculty && isLoadingFacultySections);
  const isErrorSchedule = (isStudent && isErrorStudentCourses) || (isFaculty && isErrorFacultySections);

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Hoş geldin, {user?.fullName} 👋
        </Typography>
        <Typography color="text.secondary">
          Bu sayfa Part 1 kapsamındaki kimlik doğrulama ve kullanıcı yönetimi özelliklerinin bir önizlemesini sunar.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {overviewCards.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Today's Schedule Widget */}
        {(isStudent || isFaculty) && !isLoadingSchedule && sections.length > 0 && (
          <Grid item xs={12}>
            <TodaysClassesWidget sections={sections} />
          </Grid>
        )}

        {/* Weekly Schedule Calendar */}
        <Grid item xs={12}>
          {isErrorSchedule ? (
            <Alert severity="error">
              Ders programı yüklenirken bir hata oluştu.
            </Alert>
          ) : (
            <WeeklyScheduleCalendar sections={sections} isLoading={isLoadingSchedule} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// Helper component for Today's Classes
const TodaysClassesWidget = ({ sections }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const todayName = days[todayIndex];

  const todayLabel = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar'
  }[todayName];

  // Filter and sort today's classes
  const todaysClasses = sections.flatMap(section => {
    let schedule = section.scheduleJson || section.schedule;

    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        return [];
      }
    }
    if (!schedule) return [];

    const items = [];
    const courseCode = section.course?.code || 'N/A';
    const courseName = section.course?.name || '';
    const classroom = schedule.classroom || (section.classroom?.roomNumber
      ? `${section.classroom.building || ''} ${section.classroom.roomNumber}`
      : 'Belirtilmemiş');

    // New format
    if (Array.isArray(schedule.scheduleItems)) {
      schedule.scheduleItems.forEach(item => {
        if (item.day === todayName) {
          items.push({
            id: section.id,
            courseCode,
            courseName,
            classroom,
            startTime: item.startTime,
            endTime: item.endTime,
            sectionNumber: section.sectionNumber
          });
        }
      });
    }
    // Old format
    else if (Array.isArray(schedule.days) && schedule.days.includes(todayName)) {
      items.push({
        id: section.id,
        courseCode,
        courseName,
        classroom,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        sectionNumber: section.sectionNumber
      });
    }

    return items;
  }).sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Bugünkü Dersler ({todayLabel})
          </Typography>
          <Chip label={`${todaysClasses.length} Ders`} color="primary" size="small" />
        </Stack>

        {todaysClasses.length > 0 ? (
          <Stack spacing={2}>
            {todaysClasses.map((cls, idx) => (
              <Paper key={`${cls.id}-${idx}`} variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Grid container alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" color="primary">
                      {cls.startTime} - {cls.endTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h6" fontSize="1rem">
                      {cls.courseCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {cls.courseName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight={500}>
                        Derslik:
                      </Typography>
                      <Typography variant="body2">
                        {cls.classroom}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3} textAlign={{ sm: 'right' }}>
                    <Typography variant="caption" sx={{ bgcolor: 'action.selected', px: 1, py: 0.5, borderRadius: 1 }}>
                      Section {cls.sectionNumber}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert severity="info" variant="outlined">
            Bugün için planlanmış dersiniz bulunmuyor. İyi istirahatler! ☕
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
