import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { schedulingService } from '@/services/schedulingService';
import { sectionService } from '@/services/sectionService';
import { useToast } from '@/hooks/useToast';

export const GenerateSchedulePage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const defaultSemester = currentMonth >= 8 ? 'Fall' : 'Spring';
  
  const [semester, setSemester] = useState(defaultSemester);
  const [year, setYear] = useState(currentYear);
  const [selectedSections, setSelectedSections] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get sections
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', semester, year],
    queryFn: () => sectionService.list({ semester, year }),
  });

  // Get classrooms for display
  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { apiClient } = await import('@/services/apiClient');
      const { data } = await apiClient.get('/courses/classrooms');
      return data;
    },
  });

  // Generate schedule mutation
  const generateMutation = useMutation({
    mutationFn: (data) => schedulingService.generate(data),
    onSuccess: (data) => {
      setGeneratedSchedule(data);
      showToast('Program başarıyla oluşturuldu', 'success');
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Program oluşturulamadı', 'error');
    }
  });

  // Apply schedule mutation
  const applyMutation = useMutation({
    mutationFn: (data) => schedulingService.apply(data),
    onSuccess: () => {
      showToast('Program başarıyla uygulandı', 'success');
      queryClient.invalidateQueries(['sections']);
      setGeneratedSchedule(null);
      setSelectedSections([]);
    },
    onError: (error) => {
      showToast(error.response?.data?.message || 'Program uygulanamadı', 'error');
    }
  });

  const handleSectionToggle = (sectionId) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSections.length === sections.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(sections.map(s => s.id));
    }
  };

  const handleGenerate = () => {
    if (selectedSections.length === 0) {
      showToast('Lütfen en az bir section seçin', 'warning');
      return;
    }
    generateMutation.mutate({
      sectionIds: selectedSections,
      semester,
      year
    });
  };

  const handleApply = () => {
    if (!generatedSchedule) return;
    applyMutation.mutate(generatedSchedule);
  };

  if (sectionsLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" mb={3}>Otomatik Ders Programı Oluşturma</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Dönem</InputLabel>
                <Select
                  value={semester}
                  label="Dönem"
                  onChange={(e) => {
                    setSemester(e.target.value);
                    setSelectedSections([]);
                    setGeneratedSchedule(null);
                  }}
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
                  onChange={(e) => {
                    setYear(e.target.value);
                    setSelectedSections([]);
                    setGeneratedSchedule(null);
                  }}
                >
                  <MenuItem value={currentYear - 1}>{currentYear - 1}</MenuItem>
                  <MenuItem value={currentYear}>{currentYear}</MenuItem>
                  <MenuItem value={currentYear + 1}>{currentYear + 1}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Section'ları Seçin</Typography>
            <Button size="small" onClick={handleSelectAll}>
              {selectedSections.length === sections.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </Button>
          </Stack>
          {sections.length === 0 ? (
            <Alert severity="info">Bu dönem için section bulunmamaktadır.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Seç</TableCell>
                  <TableCell>Ders Kodu</TableCell>
                  <TableCell>Ders Adı</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Öğretim Üyesi</TableCell>
                  <TableCell>Kapasite</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedSections.includes(section.id)}
                        onChange={() => handleSectionToggle(section.id)}
                      />
                    </TableCell>
                    <TableCell>{section.course?.code || 'N/A'}</TableCell>
                    <TableCell>{section.course?.name || 'N/A'}</TableCell>
                    <TableCell>{section.sectionNumber}</TableCell>
                    <TableCell>{section.instructor?.fullName || 'TBA'}</TableCell>
                    <TableCell>{section.capacity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={selectedSections.length === 0 || generateMutation.isLoading}
            >
              {generateMutation.isLoading ? <CircularProgress size={20} /> : 'Program Oluştur'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {generatedSchedule && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Oluşturulan Program</Typography>
              <Button
                variant="contained"
                color="success"
                onClick={handleApply}
                disabled={applyMutation.isLoading}
              >
                {applyMutation.isLoading ? <CircularProgress size={20} /> : 'Programı Uygula'}
              </Button>
            </Stack>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ders</TableCell>
                  <TableCell>Gün</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Derslik</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generatedSchedule.scheduleItems.map((item, index) => {
                  const section = generatedSchedule.sections.find(s => s.id === item.sectionId);
                  const classroom = classrooms.find(c => c.id === item.classroomId);
                  const classroomName = classroom 
                    ? `${classroom.building} ${classroom.roomNumber}` 
                    : (item.classroomId ? `ID: ${item.classroomId}` : 'TBA');
                  
                  // Translate day to Turkish
                  const dayTranslations = {
                    'monday': 'Pazartesi',
                    'tuesday': 'Salı',
                    'wednesday': 'Çarşamba',
                    'thursday': 'Perşembe',
                    'friday': 'Cuma',
                    'saturday': 'Cumartesi',
                    'sunday': 'Pazar'
                  };
                  const dayInTurkish = dayTranslations[item.day?.toLowerCase()] || item.day;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {section?.courseCode} - Section {section?.sectionNumber}
                      </TableCell>
                      <TableCell>{dayInTurkish}</TableCell>
                      <TableCell>{item.startTime}</TableCell>
                      <TableCell>{item.endTime || '-'}</TableCell>
                      <TableCell>{classroomName}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

