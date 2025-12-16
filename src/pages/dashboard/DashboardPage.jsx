import { Box, Card, CardContent, Typography, CircularProgress, Alert, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { WeeklyScheduleCalendar } from '@/components/schedule/WeeklyScheduleCalendar';
import { enrollmentService } from '@/services/enrollmentService';
import { sectionService } from '@/services/sectionService';

const overviewCards = [
  { title: 'Kimlik Yönetimi', description: 'Kullanıcı rollerini yönetin, yeni kullanıcılar oluşturun.' },
  { title: 'Akademik Durum', description: 'Ders kayıtlarınızı ve danışman geri bildirimlerini görüntüleyin.' },
  { title: 'Yoklama & GPS', description: 'Ders bazında yoklamalarınızı takip edin.' },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

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

