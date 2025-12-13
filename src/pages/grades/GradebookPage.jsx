import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/SaveRounded';
import { sectionService } from '@/services/sectionService';
import { enrollmentService } from '@/services/enrollmentService';
import { gradeService } from '@/services/gradeService';
import { useToast } from '@/hooks/useToast';

export const GradebookPage = () => {
  const { sectionId: paramSectionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState(paramSectionId || '');
  const [grades, setGrades] = useState({});

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['my-sections'],
    queryFn: () => sectionService.mySections(),
    enabled: true,
  });

  // Group sections by course
  const coursesWithSections = useMemo(() => {
    if (!sections || sections.length === 0) return [];
    
    const courseMap = new Map();
    sections.forEach(section => {
      const courseId = section.course?.id;
      if (!courseId) return;
      
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseCode: section.course?.code || 'N/A',
          courseName: section.course?.name || 'N/A',
          sections: []
        });
      }
      courseMap.get(courseId).sections.push(section);
    });
    
    return Array.from(courseMap.values()).sort((a, b) => 
      a.courseCode.localeCompare(b.courseCode)
    );
  }, [sections]);

  // Get sections for selected course
  const availableSections = useMemo(() => {
    if (!selectedCourseId) return [];
    const course = coursesWithSections.find(c => c.courseId === parseInt(selectedCourseId));
    return course ? course.sections : [];
  }, [selectedCourseId, coursesWithSections]);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['section-students', selectedSectionId],
    queryFn: () => enrollmentService.sectionStudents(selectedSectionId),
    enabled: Boolean(selectedSectionId),
  });

  const saveGradesMutation = useMutation({
    mutationFn: (payload) => gradeService.saveGrades(selectedSectionId, payload),
    onSuccess: async (res) => {
      toast.success(res.message || 'Notlar başarıyla kaydedildi');
      
      // Invalidate all related queries
      const invalidatePromises = [
        queryClient.invalidateQueries({ queryKey: ['section-students', selectedSectionId] }),
        queryClient.invalidateQueries({ queryKey: ['section-students'] }), // Invalidate all section students queries
        queryClient.invalidateQueries({ queryKey: ['pending-enrollments'] }), // In case any related queries
      ];
      
      await Promise.all(invalidatePromises);
      
      // Explicitly refetch the students list
      if (selectedSectionId) {
        try {
          await queryClient.refetchQueries({ queryKey: ['section-students', selectedSectionId], exact: true });
        } catch (error) {
          console.error('Error refetching students after saving grades:', error);
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Notlar kaydedilirken hata oluştu');
    },
  });

  const handleCourseChange = (event) => {
    const newCourseId = event.target.value;
    setSelectedCourseId(newCourseId);
    setSelectedSectionId('');
    setGrades({});
    navigate('/gradebook', { replace: true });
  };

  const handleSectionChange = (event) => {
    const newSectionId = event.target.value;
    setSelectedSectionId(newSectionId);
    setGrades({});
    if (newSectionId) {
      navigate(`/gradebook/${newSectionId}`, { replace: true });
    }
  };

  const handleGradeChange = (enrollmentId, field, value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    setGrades((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: Math.max(0, Math.min(100, numeric)),
      },
    }));
  };

  const summary = useMemo(() => {
    if (!students || students.length === 0) return 'Öğrenci bulunamadı';
    const savedCount = students.filter((student) => {
      const gradeData = grades[student.enrollmentId] || {};
      return gradeData.finalGrade !== undefined && gradeData.finalGrade !== null;
    }).length;
    return `${savedCount}/${students.length} öğrenci notları girildi`;
  }, [students, grades]);

  const handleSave = () => {
    if (!selectedSectionId) {
      toast.error('Lütfen bir section seçin');
      return;
    }

    const gradesToSave = students
      .map((student) => {
        const gradeData = grades[student.enrollmentId] || {};
        if (
          gradeData.midtermGrade === undefined &&
          gradeData.finalGrade === undefined
        ) {
          return null;
        }
        return {
          enrollmentId: student.enrollmentId,
          midtermGrade: gradeData.midtermGrade ?? student.midtermGrade ?? null,
          finalGrade: gradeData.finalGrade ?? student.finalGrade ?? null,
        };
      })
      .filter(Boolean);

    if (gradesToSave.length === 0) {
      toast.error('Kaydedilecek not bulunamadı');
      return;
    }

    saveGradesMutation.mutate({ grades: gradesToSave });
  };

  if (sectionsLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Sectionlar yükleniyor...</Typography>
      </Stack>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <Alert severity="info">
        Size atanmış section bulunmuyor. Lütfen yönetici ile iletişime geçin.
      </Alert>
    );
  }

  // Auto-select first course and section if not selected
  useEffect(() => {
    if (coursesWithSections.length > 0 && !selectedCourseId) {
      const firstCourse = coursesWithSections[0];
      setSelectedCourseId(firstCourse.courseId.toString());
      if (firstCourse.sections.length > 0 && !selectedSectionId && !paramSectionId) {
        setSelectedSectionId(firstCourse.sections[0].id.toString());
        navigate(`/gradebook/${firstCourse.sections[0].id}`, { replace: true });
      }
    }
  }, [coursesWithSections, selectedCourseId, selectedSectionId, paramSectionId, navigate]);

  // If paramSectionId exists, find and select the corresponding course
  useEffect(() => {
    if (paramSectionId && sections && sections.length > 0 && !selectedCourseId) {
      const section = sections.find(s => s.id.toString() === paramSectionId);
      if (section && section.course?.id) {
        setSelectedCourseId(section.course.id.toString());
        setSelectedSectionId(paramSectionId);
      }
    }
  }, [paramSectionId, sections, selectedCourseId]);

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Not Defteri
      </Typography>
      
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Ders Seçin</InputLabel>
          <Select
            value={selectedCourseId}
            onChange={handleCourseChange}
            label="Ders Seçin"
          >
            {coursesWithSections.map((course) => (
              <MenuItem key={course.courseId} value={course.courseId.toString()}>
                {course.courseCode} - {course.courseName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 300 }} disabled={!selectedCourseId}>
          <InputLabel>Section Seçin</InputLabel>
          <Select
            value={selectedSectionId}
            onChange={handleSectionChange}
            label="Section Seçin"
          >
            {availableSections.map((section) => (
              <MenuItem key={section.id} value={section.id.toString()}>
                Section {section.sectionNumber} - {section.year} {section.semester}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {!selectedSectionId ? (
        <Alert severity="info">Lütfen bir section seçin.</Alert>
      ) : studentsLoading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Öğrenci listesi yükleniyor...</Typography>
        </Stack>
      ) : !students || students.length === 0 ? (
        <Alert severity="info">Bu section'da kayıtlı öğrenci bulunmuyor.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" color="text.secondary">
                {summary}
              </Typography>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saveGradesMutation.isPending}
              >
                {saveGradesMutation.isPending ? 'Kaydediliyor...' : 'Notları Kaydet'}
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Öğrenci</TableCell>
                  <TableCell>Numara</TableCell>
                  <TableCell align="center">Vize</TableCell>
                  <TableCell align="center">Final</TableCell>
                  <TableCell align="center">Harf Notu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  const gradeData = grades[student.enrollmentId] || {};
                  const midtermValue =
                    gradeData.midtermGrade !== undefined
                      ? gradeData.midtermGrade
                      : student.midtermGrade ?? '';
                  const finalValue =
                    gradeData.finalGrade !== undefined
                      ? gradeData.finalGrade
                      : student.finalGrade ?? '';

                  return (
                    <TableRow key={student.enrollmentId || student.id}>
                      <TableCell>
                        {student.name || student.studentName}
                      </TableCell>
                      <TableCell>
                        {student.studentNumber || student.studentId}
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={midtermValue}
                          onChange={(event) =>
                            handleGradeChange(
                              student.enrollmentId || student.id,
                              'midtermGrade',
                              event.target.value
                            )
                          }
                          inputProps={{ min: 0, max: 100 }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={finalValue}
                          onChange={(event) =>
                            handleGradeChange(
                              student.enrollmentId || student.id,
                              'finalGrade',
                              event.target.value
                            )
                          }
                          inputProps={{ min: 0, max: 100 }}
                          size="small"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {student.letterGrade || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

