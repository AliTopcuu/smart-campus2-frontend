import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { enrollmentService } from '@/services/enrollmentService';

export const CompletedCoursesPage = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => enrollmentService.myCourses(),
    staleTime: 0,
    cacheTime: 0,
  });

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
        <Typography mt={2}>Bitirilmiş dersler yükleniyor...</Typography>
      </Stack>
    );
  }

  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Bitirilmiş dersler listesi alınamadı.';
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => refetch()}>Tekrar dene</Button>}
      >
        {errorMessage}
      </Alert>
    );
  }

  // Filter courses that have grades (letterGrade or finalGrade)
  const completedCourses = (Array.isArray(data) ? data : []).filter((enrollment) => {
    const hasLetterGrade = enrollment.grades?.letter || enrollment.letterGrade;
    const hasFinalGrade = enrollment.grades?.final !== null && enrollment.grades?.final !== undefined 
      || enrollment.finalGrade !== null && enrollment.finalGrade !== undefined;
    return hasLetterGrade || hasFinalGrade;
  });

  if (completedCourses.length === 0) {
    return (
      <Box>
        <Typography variant="h4" mb={3}>
          Bitirilmiş Dersler
        </Typography>
        <Alert severity="info">
          Henüz bitirilmiş dersiniz bulunmuyor. Notu girilmiş dersler burada görüntülenecektir.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Bitirilmiş Dersler
      </Typography>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ders Kodu</TableCell>
                <TableCell>Ders Adı</TableCell>
                <TableCell>Section</TableCell>
                <TableCell align="center">Vize</TableCell>
                <TableCell align="center">Final</TableCell>
                <TableCell align="center">Harf Notu</TableCell>
                <TableCell align="center">Dönem</TableCell>
                <TableCell align="center">Yıl</TableCell>
                <TableCell align="center">Durum</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedCourses.map((enrollment) => {
                const letterGrade = enrollment.grades?.letter || enrollment.letterGrade;
                const midtermGrade = enrollment.grades?.midterm !== null && enrollment.grades?.midterm !== undefined
                  ? enrollment.grades.midterm
                  : enrollment.midtermGrade;
                const finalGrade = enrollment.grades?.final !== null && enrollment.grades?.final !== undefined
                  ? enrollment.grades.final
                  : enrollment.finalGrade;
                const status = enrollment.status || 'completed';
                
                // Get semester and year from section
                const semester = enrollment.section?.semester || 'N/A';
                const year = enrollment.section?.year || 'N/A';

                // Determine status color
                let statusColor = 'success';
                let statusLabel = 'Tamamlandı';
                if (status === 'failed' || letterGrade === 'F') {
                  statusColor = 'error';
                  statusLabel = 'Kaldı';
                } else if (status === 'completed') {
                  statusColor = 'success';
                  statusLabel = 'Geçti';
                }

                return (
                  <TableRow key={enrollment.enrollmentId}>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {enrollment.course?.code || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color="text.secondary">
                        {enrollment.course?.name || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {enrollment.section?.sectionNumber || 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                      {midtermGrade !== null && midtermGrade !== undefined ? midtermGrade : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {finalGrade !== null && finalGrade !== undefined ? finalGrade : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {letterGrade ? (
                        <Chip
                          label={letterGrade}
                          size="small"
                          color={letterGrade === 'F' ? 'error' : 'success'}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="center">{semester}</TableCell>
                    <TableCell align="center">{year}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={statusLabel}
                        size="small"
                        color={statusColor}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};
