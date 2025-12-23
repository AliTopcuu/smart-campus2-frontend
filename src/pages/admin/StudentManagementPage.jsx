import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Paper,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/useToast';

export const StudentManagementPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scholarshipFilter, setScholarshipFilter] = useState(null); // null = tüm öğrenciler

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students', search, scholarshipFilter],
    queryFn: () => userService.getStudents({
      search,
      hasScholarship: scholarshipFilter,
      limit: 100
    }),
  });

  const updateScholarshipMutation = useMutation({
    mutationFn: ({ userId, hasScholarship }) => userService.updateStudentScholarship(userId, hasScholarship),
    onSuccess: (res) => {
      toast.success(res.message || 'Burslu durumu güncellendi');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Burslu durumu güncellenirken hata oluştu.';
      toast.error(errorMsg);
    },
  });

  const handleToggleScholarship = (userId, currentStatus) => {
    const newStatus = !currentStatus;
    updateScholarshipMutation.mutate({ userId, hasScholarship: newStatus });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    console.error('Error loading students:', error);
    return (
      <Alert severity="error">
        {error?.response?.data?.message || error?.message || 'Öğrenciler yüklenirken bir hata oluştu.'}
      </Alert>
    );
  }

  const students = data?.data || [];

  console.log('Students data:', { students, data, isLoading, isError });

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          Öğrenci Yönetimi
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Burslu öğrencileri yönetin. Burslu öğrenciler gün içinde 1 kez ücretsiz yemek hakkına sahiptir.
        </Typography>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  placeholder="Öğrenci adı veya email ile ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant={scholarshipFilter === true ? 'contained' : 'outlined'}
                  onClick={() => setScholarshipFilter(scholarshipFilter === true ? null : true)}
                  size="small"
                >
                  Burslular
                </Button>
                <Button
                  variant={scholarshipFilter === false ? 'contained' : 'outlined'}
                  onClick={() => setScholarshipFilter(scholarshipFilter === false ? null : false)}
                  size="small"
                >
                  Burslu Olmayanlar
                </Button>
                {scholarshipFilter !== null && (
                  <Button
                    variant="text"
                    onClick={() => setScholarshipFilter(null)}
                    size="small"
                  >
                    Tümü
                  </Button>
                )}
              </Stack>

              <Paper variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Öğrenci Numarası</TableCell>
                      <TableCell>Ad Soyad</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Bölüm</TableCell>
                      <TableCell>GPA</TableCell>
                      <TableCell align="center">Burslu Durumu</TableCell>
                      <TableCell align="center">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            Öğrenci bulunamadı
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {student.studentNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{student.fullName}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.department || '-'}</TableCell>
                          <TableCell>{student.gpa ? student.gpa.toFixed(2) : '-'}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={student.hasScholarship ? 'Burslu' : 'Burslu Değil'}
                              color={student.hasScholarship ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={student.hasScholarship || false}
                              onChange={() => handleToggleScholarship(student.id, student.hasScholarship)}
                              disabled={updateScholarshipMutation.isPending}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>

              {data?.meta && (
                <Typography variant="body2" color="text.secondary" align="center">
                  Toplam {data.meta.total} öğrenci
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

