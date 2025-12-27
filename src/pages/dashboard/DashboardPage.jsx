import { Box, Card, CardContent, Typography, CircularProgress, Alert, Stack, Chip, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { WeeklyScheduleCalendar } from '@/components/schedule/WeeklyScheduleCalendar';
import { enrollmentService } from '@/services/enrollmentService';
import { sectionService } from '@/services/sectionService';
import { schedulingService } from '@/services/schedulingService';
import { AdminDashboardPage } from '@/pages/admin/analytics/AdminDashboardPage';

import { gradeService } from '@/services/gradeService';
import { attendanceService } from '@/services/attendanceService';
import { School, Class, Assignment, AccessTime, TrendingUp, CreditCard } from '@mui/icons-material';

// Dashboard istatistik kartları için yardımcı bileşen
const StatsCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{
      position: 'absolute',
      right: -20,
      top: -20,
      opacity: 0.1,
      transform: 'rotate(15deg)',
      color: color
    }}>
      {icon}
    </Box>
    <CardContent>
      <Stack spacing={2}>
        <Box sx={{
          bgcolor: `${color}15`,
          color: color,
          width: 48,
          height: 48,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  // Admin için AdminDashboardPage göster
  if (isAdmin) {
    return <AdminDashboardPage />;
  }

  // Determine current semester and year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentSemester = currentMonth >= 8 ? 'Fall' : 'Spring';

  // Fetch schedule for both students and faculty
  const { data: scheduleData, isLoading: isLoadingSchedule, isError: isErrorSchedule } = useQuery({
    queryKey: ['dashboard-schedule', currentSemester, currentYear],
    queryFn: () => schedulingService.getMySchedule(currentSemester, currentYear),
    enabled: (isStudent || isFaculty),
  });

  // Prepare sections data for calendar from schedulingService format
  const getSectionsForCalendar = () => {
    if (!scheduleData || Object.keys(scheduleData).length === 0) return [];

    // Transform { monday: [items], tuesday: [items] } to array of sections for Calendar
    return Object.entries(scheduleData).flatMap(([day, items]) =>
      items.map(item => ({
        id: item.sectionId,
        courseCode: item.courseCode,
        courseName: item.courseName,
        sectionNumber: item.sectionNumber,
        scheduleJson: {
          scheduleItems: [{
            day: day.charAt(0).toUpperCase() + day.slice(1), // monday -> Monday
            startTime: item.startTime,
            endTime: item.endTime,
            classroomId: null
          }]
        },
        classroom: item.classroom ? {
          building: item.classroom.split(' ')[0],
          roomNumber: item.classroom.split(' ').slice(1).join(' ')
        } : null,
        course: { code: item.courseCode, name: item.courseName }
      }))
    );
  };

  const sections = getSectionsForCalendar();

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Hoş geldin, {user?.fullName} 👋
        </Typography>
        <Typography color="text.secondary">
          Akademik durumunu ve günlük programını buradan takip edebilirsin.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Student Stats */}
        {isStudent && (
          <StudentStatsWidget />
        )}

        {/* Faculty Stats */}
        {isFaculty && (
          <FacultyStatsWidget />
        )}

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

const StudentStatsWidget = () => {
  // Fetch GPA and Credits
  const { data: gradesData } = useQuery({
    queryKey: ['dashboard-student-grades'],
    queryFn: () => gradeService.myGrades(null, {}),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch Attendance
  const { data: attendanceData } = useQuery({
    queryKey: ['dashboard-student-attendance'],
    queryFn: () => attendanceService.getMyAttendanceByCourse(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Courses for active count
  const { data: coursesData } = useQuery({
    queryKey: ['dashboard-student-courses'],
    queryFn: () => enrollmentService.myCourses(),
    staleTime: 5 * 60 * 1000,
  });

  const cgpa = gradesData?.cgpa || '0.00';
  const totalCredits = gradesData?.grades?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;
  const activeCourses = coursesData?.filter(c => c.status === 'enrolled')?.length || 0;

  // Calculate average attendance
  const avgAttendance = attendanceData?.length > 0
    ? Math.round(attendanceData.reduce((acc, curr) => acc + (curr.attendancePercentage || 0), 0) / attendanceData.length)
    : 0;

  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Genel Ortalama"
            value={cgpa}
            icon={<TrendingUp sx={{ fontSize: 60 }} />}
            color="#4caf50"
            subtitle="GNO (CGPA)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Toplam Kredi"
            value={totalCredits}
            icon={<CreditCard sx={{ fontSize: 60 }} />}
            color="#2196f3"
            subtitle="Tamamlanan Kredi"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Aktif Dersler"
            value={activeCourses}
            icon={<Class sx={{ fontSize: 60 }} />}
            color="#ff9800"
            subtitle="Bu Dönem"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Ortalama Katılım"
            value={`%${avgAttendance}`}
            icon={<AccessTime sx={{ fontSize: 60 }} />}
            color={avgAttendance < 70 ? "#f44336" : "#9c27b0"}
            subtitle={avgAttendance < 70 ? "Kritik Seviye!" : "Devam Durumu"}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

const FacultyStatsWidget = () => {
  const { data: sections } = useQuery({
    queryKey: ['dashboard-faculty-sections'],
    queryFn: () => sectionService.mySections(),
  });

  const totalSections = sections?.length || 0;
  const totalStudents = sections?.reduce((acc, s) => acc + (s.enrolledCount || 0), 0) || 0;
  const uniqueCourses = new Set(sections?.map(s => s.course?.code)).size || 0;

  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Verilen Dersler"
            value={uniqueCourses}
            icon={<School sx={{ fontSize: 60 }} />}
            color="#2196f3"
            subtitle="Farklı Ders Kodu"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Aktif Şubeler"
            value={totalSections}
            icon={<Class sx={{ fontSize: 60 }} />}
            color="#ff9800"
            subtitle="Toplam Section"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Toplam Öğrenci"
            value={totalStudents}
            icon={<Assignment sx={{ fontSize: 60 }} />}
            color="#4caf50"
            subtitle="Tüm Şubelerde"
          />
        </Grid>
      </Grid>
    </Grid>
  );
};
