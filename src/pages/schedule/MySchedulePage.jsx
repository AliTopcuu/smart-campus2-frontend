import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { schedulingService } from '@/services/schedulingService';
import { WeeklyScheduleCalendar } from '@/components/schedule/WeeklyScheduleCalendar';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma'
};

import { useAuth } from '@/context/AuthContext';

export const MySchedulePage = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSemester = currentMonth >= 8 ? 'Fall' : 'Spring';

  const [semester, setSemester] = useState(defaultSemester);
  const [year, setYear] = useState(currentYear);

  const { data: schedule, isLoading, isError } = useQuery({
    queryKey: ['my-schedule', user?.id, semester, year],
    queryFn: () => schedulingService.getMySchedule(semester, year),
    enabled: !!semester && !!year && !!user,
  });

  const handleExportICal = () => {
    schedulingService.exportICal(semester, year);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Program yüklenirken bir hata oluştu.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Ders Programım</Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Dönem</InputLabel>
            <Select
              value={semester}
              label="Dönem"
              onChange={(e) => setSemester(e.target.value)}
            >
              <MenuItem value="Fall">Güz</MenuItem>
              <MenuItem value="Spring">Bahar</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Yıl</InputLabel>
            <Select
              value={year}
              label="Yıl"
              onChange={(e) => setYear(e.target.value)}
            >
              <MenuItem value={currentYear - 1}>{currentYear - 1}</MenuItem>
              <MenuItem value={currentYear}>{currentYear}</MenuItem>
              <MenuItem value={currentYear + 1}>{currentYear + 1}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportICal}
          >
            iCal İndir
          </Button>
        </Stack>
      </Stack>

      {schedule && Object.keys(schedule).length > 0 ? (
        <WeeklyScheduleCalendar
          sections={Object.entries(schedule).flatMap(([day, items]) =>
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
          )}
        />
      ) : (
        <Alert severity="info">Bu dönem için ders programınız bulunmamaktadır.</Alert>
      )}
    </Container>
  );
};

