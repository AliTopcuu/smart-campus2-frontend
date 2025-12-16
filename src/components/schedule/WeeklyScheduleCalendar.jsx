import { Box, Card, CardContent, Typography, Paper, CircularProgress, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';

const dayLabels = {
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
  Saturday: 'Cumartesi',
  Sunday: 'Pazar',
};

// Only show weekdays (Monday to Friday)
const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Parse time string (HH:MM) to minutes from start of day
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Convert minutes to percentage of day (assuming 8:00-20:00 range)
const minutesToPosition = (minutes) => {
  const startMinutes = timeToMinutes('08:00');
  const endMinutes = timeToMinutes('20:00');
  const totalMinutes = endMinutes - startMinutes;
  return ((minutes - startMinutes) / totalMinutes) * 100;
};

// Calculate height percentage for a time range
const calculateHeight = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const startMinutes = timeToMinutes('08:00');
  const endMinutes = timeToMinutes('20:00');
  const totalMinutes = endMinutes - startMinutes;
  return ((end - start) / totalMinutes) * 100;
};

export const WeeklyScheduleCalendar = ({ sections = [], isLoading = false }) => {
  // Parse sections and extract schedule items
  const scheduleItems = [];

  sections.forEach((section) => {
    let schedule = section.scheduleJson || section.schedule;
    
    // Handle string format
    if (typeof schedule === 'string') {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        schedule = null;
      }
    }

    if (!schedule) return;

    const courseCode = section.course?.code || section.courseCode || 'N/A';
    const courseName = section.course?.name || section.courseName || '';
    const sectionNumber = section.sectionNumber || '';
    const classroom = schedule.classroom || section.classroom?.building + ' ' + section.classroom?.roomNumber || 'Belirtilmemiş';

    // New format: scheduleItems array
    if (Array.isArray(schedule.scheduleItems) && schedule.scheduleItems.length > 0) {
      schedule.scheduleItems.forEach((item) => {
        if (item.day && item.startTime && item.endTime) {
          scheduleItems.push({
            day: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            courseCode,
            courseName,
            sectionNumber,
            classroom,
            sectionId: section.id,
          });
        }
      });
    }
    // Old format: days array + single startTime/endTime
    else if (Array.isArray(schedule.days) && schedule.days.length > 0 && schedule.startTime && schedule.endTime) {
      schedule.days.forEach((day) => {
        scheduleItems.push({
          day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          courseCode,
          courseName,
          sectionNumber,
          classroom,
          sectionId: section.id,
        });
      });
    }
  });

  // Group schedule items by day
  const scheduleByDay = {};
  dayOrder.forEach((day) => {
    scheduleByDay[day] = scheduleItems.filter((item) => item.day === day);
  });

  // Get all unique time ranges for positioning
  const allTimes = new Set();
  scheduleItems.forEach((item) => {
    allTimes.add(item.startTime);
    allTimes.add(item.endTime);
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack alignItems="center" py={4}>
            <CircularProgress size={40} />
            <Typography mt={2} color="text.secondary">
              Ders programı yükleniyor...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" textAlign="center" py={3}>
            Bu hafta için ders programı bulunmuyor.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom mb={2}>
          Haftalık Ders Programı
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: { xs: 600, sm: 800 } }}>
            {/* Header */}
            <Grid container spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={2}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Saat
                </Typography>
              </Grid>
              {dayOrder.map((day) => (
                <Grid item xs={2} key={day}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} textAlign="center">
                    {dayLabels[day]}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Time slots and schedule */}
            <Box sx={{ position: 'relative', minHeight: 600 }}>
              {/* Time grid lines */}
              {timeSlots.map((time) => (
                <Box
                  key={time}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${minutesToPosition(timeToMinutes(time))}%`,
                    height: '1px',
                    bgcolor: 'divider',
                    zIndex: 1,
                  }}
                />
              ))}

              {/* Schedule items */}
              {dayOrder.map((day, dayIndex) => {
                const dayItems = scheduleByDay[day] || [];
                return (
                  <Box
                    key={day}
                    sx={{
                      position: 'absolute',
                      left: `${16.67 + dayIndex * 16.67}%`,
                      width: '16.67%',
                      top: 0,
                      bottom: 0,
                      borderLeft: dayIndex > 0 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    {dayItems.map((item, itemIndex) => {
                      const top = minutesToPosition(timeToMinutes(item.startTime));
                      const height = calculateHeight(item.startTime, item.endTime);
                      
                      return (
                        <Paper
                          key={`${item.sectionId}-${item.startTime}-${itemIndex}`}
                          elevation={2}
                          sx={{
                            position: 'absolute',
                            top: `${top}%`,
                            height: `${height}%`,
                            width: 'calc(100% - 8px)',
                            left: '4px',
                            p: 0.75,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            zIndex: 2,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            '&:hover': {
                              elevation: 4,
                              bgcolor: 'primary.main',
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s ease',
                            },
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} display="block">
                            {item.courseCode}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                            {item.startTime} - {item.endTime}
                          </Typography>
                          {item.sectionNumber && (
                            <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              Section {item.sectionNumber}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', opacity: 0.8, mt: 0.5 }}>
                            {item.classroom}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                );
              })}

              {/* Time labels on the left */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  width: '16.67%',
                  top: 0,
                  bottom: 0,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  pr: 1,
                }}
              >
                {timeSlots.map((time) => (
                  <Typography
                    key={time}
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: `${minutesToPosition(timeToMinutes(time))}%`,
                      transform: 'translateY(-50%)',
                      color: 'text.secondary',
                    }}
                  >
                    {time}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
