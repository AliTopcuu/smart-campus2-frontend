import { Box, Card, CardContent, Typography, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Paper, Chip } from '@mui/material';

const dayLabels = {
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
};

// Only show weekdays (Monday to Friday)
const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Time slots for the schedule (hourly)
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Parse time string (HH:MM) to minutes from start of day
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Check if a time slot overlaps with a schedule item
// A time slot overlaps if the course starts at or before this slot and ends after this slot
const isTimeInRange = (timeSlot, nextTimeSlot, startTime, endTime) => {
  const slotStart = timeToMinutes(timeSlot);
  const slotEnd = timeToMinutes(nextTimeSlot);
  const courseStart = timeToMinutes(startTime);
  const courseEnd = timeToMinutes(endTime);
  // Check if time slot overlaps with course time
  return slotStart < courseEnd && slotEnd > courseStart;
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
    const classroom = schedule.classroom || (section.classroom?.building && section.classroom?.roomNumber 
      ? `${section.classroom.building} ${section.classroom.roomNumber}` 
      : 'Belirtilmemiş');

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

  // Group schedule items by day and time slot
  const getScheduleForDayAndTime = (day, timeSlot, nextTimeSlot) => {
    return scheduleItems.filter(
      (item) => item.day === day && isTimeInRange(timeSlot, nextTimeSlot, item.startTime, item.endTime)
    );
  };

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
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Saat</TableCell>
                {dayOrder.map((day) => (
                  <TableCell key={day} align="center" sx={{ fontWeight: 600 }}>
                    {dayLabels[day]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map((timeSlot, index) => {
                // Skip last time slot as it's only end time
                if (index === timeSlots.length - 1) return null;
                
                const nextTimeSlot = timeSlots[index + 1];
                
                return (
                  <TableRow key={timeSlot} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: 500, borderRight: '1px solid', borderColor: 'divider' }}>
                      {timeSlot} - {nextTimeSlot}
                    </TableCell>
                    {dayOrder.map((day) => {
                      const items = getScheduleForDayAndTime(day, timeSlot, nextTimeSlot);
                      return (
                        <TableCell
                          key={`${day}-${timeSlot}`}
                          sx={{
                            borderRight: day !== dayOrder[dayOrder.length - 1] ? '1px solid' : 'none',
                            borderColor: 'divider',
                            verticalAlign: 'top',
                            minWidth: 150,
                          }}
                        >
                          {items.length > 0 ? (
                            <Stack spacing={0.5}>
                              {items.map((item, itemIndex) => (
                                <Paper
                                  key={`${item.sectionId}-${itemIndex}`}
                                  elevation={1}
                                  sx={{
                                    p: 1,
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                    '&:hover': {
                                      bgcolor: 'primary.main',
                                      elevation: 2,
                                    },
                                  }}
                                >
                                  <Typography variant="caption" fontWeight={600} display="block">
                                    {item.courseCode}
                                  </Typography>
                                  <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                    {item.startTime} - {item.endTime}
                                  </Typography>
                                  {item.sectionNumber && (
                                    <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                      Section {item.sectionNumber}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', opacity: 0.8, mt: 0.5 }}>
                                    {item.classroom}
                                  </Typography>
                                </Paper>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};
